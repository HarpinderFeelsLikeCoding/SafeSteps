import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import { Client } from '@googlemaps/google-maps-services-js';
import * as turf from '@turf/turf';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Initialize services
let db;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const googleMapsClient = new Client({});

// Connect to MongoDB Atlas
async function connectToMongoDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('safestep');
    console.log('✅ Connected to MongoDB Atlas');
    
    await ensureIndexes();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Ensure proper indexes for geo and vector search
async function ensureIndexes() {
  try {
    const collection = db.collection('crashes');
    
    // Create geospatial index for location queries
    await collection.createIndex({ location: '2dsphere' });
    console.log('✅ Geospatial index created');
    
    // Check if vector search index exists
    try {
      const indexes = await collection.listSearchIndexes().toArray();
      const vectorIndex = indexes.find(index => index.name === 'crash_vector_index');
      
      if (!vectorIndex) {
        console.log('🔄 Vector search index needs to be created manually in MongoDB Atlas UI');
        console.log('📋 Please create a vector search index with these settings:');
        console.log('   - Index Name: crash_vector_index');
        console.log('   - Field Path: narrative_embedding');
        console.log('   - Dimensions: 1536');
        console.log('   - Similarity: cosine');
        console.log('   - Collection: crashes');
        console.log('   - Database: safestep');
      } else {
        console.log('✅ Vector search index already exists');
      }
    } catch (indexError) {
      console.log('ℹ️ Vector search index will be created manually in Atlas UI');
    }
  } catch (error) {
    console.error('⚠️ Error setting up indexes:', error);
  }
}

// Generate embeddings for crash narratives
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000), // Limit input length
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

// Geocode address using Google Cloud Geocoding API
async function geocodeAddress(address) {
  try {
    const response = await googleMapsClient.geocode({
      params: {
        address: address,
        key: process.env.GOOGLE_CLOUD_API_KEY,
      },
    });

    if (response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: response.data.results[0].formatted_address
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Get route directions using Google Cloud Directions API
async function getRouteDirections(origin, destination, mode = 'driving') {
  try {
    const response = await googleMapsClient.directions({
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: mode,
        alternatives: true,
        key: process.env.GOOGLE_CLOUD_API_KEY,
      },
    });

    return response.data.routes.map((route, index) => ({
      id: `route_${index}`,
      summary: route.summary,
      distance: route.legs[0].distance,
      duration: route.legs[0].duration,
      polyline: route.overview_polyline.points,
      bounds: route.bounds,
      legs: route.legs
    }));
  } catch (error) {
    console.error('Directions error:', error);
    return [];
  }
}

// Decode Google polyline to coordinates
function decodePolyline(encoded) {
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charAt(index++).charCodeAt(0) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charAt(index++).charCodeAt(0) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push([lat / 1e5, lng / 1e5]);
  }
  return poly;
}

// Find crashes near route using geospatial query
async function findCrashesNearRoute(routeCoordinates, bufferKm = 0.5) {
  try {
    const collection = db.collection('crashes');
    
    // Create a buffer around the route
    const lineString = turf.lineString(routeCoordinates.map(coord => [coord[1], coord[0]]));
    const buffered = turf.buffer(lineString, bufferKm, { units: 'kilometers' });
    
    // Query crashes within the buffered area
    const crashes = await collection.find({
      location: {
        $geoWithin: {
          $geometry: buffered.geometry
        }
      }
    }).limit(100).toArray();

    return crashes;
  } catch (error) {
    console.error('Error finding crashes near route:', error);
    return [];
  }
}

// Vector search for similar crash narratives
async function vectorSearchCrashes(queryEmbedding, limit = 20) {
  try {
    const collection = db.collection('crashes');
    
    const pipeline = [
      {
        $vectorSearch: {
          index: 'crash_vector_index',
          path: 'narrative_embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: limit
        }
      },
      {
        $project: {
          _id: 1,
          crash_date: 1,
          crash_time: 1,
          borough: 1,
          on_street_name: 1,
          cross_street_name: 1,
          latitude: 1,
          longitude: 1,
          number_of_persons_injured: 1,
          number_of_persons_killed: 1,
          vehicle_type_code1: 1,
          contributing_factor_vehicle_1: 1,
          crash_narrative: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return results;
  } catch (error) {
    console.log('ℹ️ Vector search not available yet - using geospatial search only');
    return [];
  }
}

// Calculate safety score using AI analysis
async function calculateSafetyScore(crashes, routeInfo) {
  try {
    const recentCrashes = crashes.filter(crash => {
      const crashDate = new Date(crash.crash_date);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return crashDate >= sixMonthsAgo;
    });

    const fatalCrashes = crashes.filter(crash => crash.number_of_persons_killed > 0);
    const injuryCrashes = crashes.filter(crash => crash.number_of_persons_injured > 0);

    const prompt = `
    Analyze this route safety data and provide a comprehensive assessment:
    
    Route: ${routeInfo.summary || 'Route analysis'}
    Distance: ${routeInfo.distance?.text || 'Unknown'}
    Duration: ${routeInfo.duration?.text || 'Unknown'}
    
    Crash Analysis:
    - Total crashes found: ${crashes.length}
    - Recent crashes (6 months): ${recentCrashes.length}
    - Fatal crashes: ${fatalCrashes.length}
    - Injury crashes: ${injuryCrashes.length}
    
    Top contributing factors: ${[...new Set(crashes.map(c => c.contributing_factor_vehicle_1).filter(Boolean))].slice(0, 5).join(', ')}
    
    Vehicle types involved: ${[...new Set(crashes.map(c => c.vehicle_type_code1).filter(Boolean))].slice(0, 5).join(', ')}
    
    Calculate a safety score (0-100) and provide actionable insights.
    
    Respond with JSON only:
    {
      "safetyScore": number,
      "riskLevel": "low" | "medium" | "high",
      "insights": ["insight1", "insight2", "insight3"],
      "recommendations": ["rec1", "rec2", "rec3"],
      "keyRisks": ["risk1", "risk2"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error calculating safety score:', error);
    
    // Fallback calculation
    const baseScore = 85;
    const crashPenalty = Math.min(crashes.length * 2, 30);
    const fatalPenalty = crashes.filter(c => c.number_of_persons_killed > 0).length * 10;
    const finalScore = Math.max(10, baseScore - crashPenalty - fatalPenalty);
    
    return {
      safetyScore: finalScore,
      riskLevel: finalScore >= 70 ? 'low' : finalScore >= 50 ? 'medium' : 'high',
      insights: ['Analysis based on crash frequency and severity'],
      recommendations: ['Exercise caution in high-traffic areas'],
      keyRisks: ['Traffic congestion', 'Intersection safety']
    };
  }
}

// API Routes

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const mongoStatus = db ? 'connected' : 'disconnected';
    const openaiStatus = process.env.OPENAI_API_KEY ? 'configured' : 'not configured';
    const googleStatus = process.env.GOOGLE_CLOUD_API_KEY ? 'configured' : 'not configured';
    
    // Test MongoDB connection
    if (db) {
      await db.admin().ping();
    }
    
    res.json({
      status: 'healthy',
      services: {
        mongodb: mongoStatus,
        openai: openaiStatus,
        googleCloud: googleStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Route computation endpoint
app.post('/api/compute-routes', async (req, res) => {
  try {
    const { origin, destination, travelMode = 'driving' } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    // Geocode addresses
    const originCoords = await geocodeAddress(origin);
    const destCoords = await geocodeAddress(destination);
    
    if (!originCoords || !destCoords) {
      return res.status(400).json({ error: 'Could not geocode addresses' });
    }

    // Get route alternatives
    const routes = await getRouteDirections(originCoords, destCoords, travelMode);
    
    if (routes.length === 0) {
      return res.status(404).json({ error: 'No routes found' });
    }

    // Process each route
    const processedRoutes = await Promise.all(routes.map(async (route, index) => {
      const coordinates = decodePolyline(route.polyline);
      
      // Find crashes near this route
      const crashes = await findCrashesNearRoute(coordinates);
      
      // Calculate safety score
      const safetyAnalysis = await calculateSafetyScore(crashes, route);
      
      return {
        id: route.id,
        name: index === 0 ? 'Recommended Route' : `Alternative ${index}`,
        summary: route.summary,
        distance: route.distance,
        duration: route.duration,
        coordinates: coordinates,
        polyline: route.polyline,
        crashes: crashes,
        safetyScore: safetyAnalysis.safetyScore,
        safetyAnalysis: safetyAnalysis,
        type: index === 0 ? 'recommended' : 'alternative'
      };
    }));

    // Sort by safety score for route recommendations
    const sortedRoutes = processedRoutes.sort((a, b) => b.safetyScore - a.safetyScore);
    
    res.json({
      origin: originCoords,
      destination: destCoords,
      routes: sortedRoutes,
      metadata: {
        totalRoutes: sortedRoutes.length,
        safestRoute: sortedRoutes[0]?.id,
        travelMode: travelMode
      }
    });

  } catch (error) {
    console.error('Route computation error:', error);
    res.status(500).json({ error: 'Failed to compute routes' });
  }
});

// Route analysis endpoint with vector search
app.post('/api/analyze-route', async (req, res) => {
  try {
    const { routeId, routeSummary, coordinates } = req.body;
    
    if (!coordinates || coordinates.length === 0) {
      return res.status(400).json({ error: 'Route coordinates are required' });
    }

    // Generate embedding for route summary
    const routeNarrative = `Route through ${routeSummary || 'city streets'} with ${coordinates.length} waypoints`;
    const routeEmbedding = await generateEmbedding(routeNarrative);
    
    // Find crashes near route (geospatial)
    const nearbyCrashes = await findCrashesNearRoute(coordinates);
    
    // Find similar crashes (vector search)
    let similarCrashes = [];
    if (routeEmbedding) {
      similarCrashes = await vectorSearchCrashes(routeEmbedding);
    }
    
    // Combine and deduplicate crashes
    const allCrashes = [...nearbyCrashes];
    const crashIds = new Set(allCrashes.map(c => c._id.toString()));
    
    similarCrashes.forEach(crash => {
      if (!crashIds.has(crash._id.toString())) {
        allCrashes.push(crash);
      }
    });

    // Enhanced safety analysis
    const safetyAnalysis = await calculateSafetyScore(allCrashes, { 
      summary: routeSummary,
      distance: { text: `${coordinates.length} waypoints` }
    });

    res.json({
      routeId,
      analysis: {
        totalCrashes: allCrashes.length,
        nearbyCrashes: nearbyCrashes.length,
        similarCrashes: similarCrashes.length,
        safetyScore: safetyAnalysis.safetyScore,
        riskLevel: safetyAnalysis.riskLevel,
        insights: safetyAnalysis.insights,
        recommendations: safetyAnalysis.recommendations,
        keyRisks: safetyAnalysis.keyRisks
      },
      crashes: allCrashes.slice(0, 50), // Limit for performance
      metadata: {
        analysisType: 'hybrid_geo_vector',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Route analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze route' });
  }
});

// Bulk data ingestion endpoint (for hackathon setup)
app.post('/api/ingest-crash-data', async (req, res) => {
  try {
    const { crashes } = req.body;
    
    if (!Array.isArray(crashes)) {
      return res.status(400).json({ error: 'Crashes must be an array' });
    }

    const collection = db.collection('crashes');
    let processed = 0;
    let errors = 0;

    for (const crash of crashes.slice(0, 100)) { // Limit for demo
      try {
        // Add GeoJSON location field
        if (crash.latitude && crash.longitude) {
          crash.location = {
            type: 'Point',
            coordinates: [parseFloat(crash.longitude), parseFloat(crash.latitude)]
          };
        }

        // Generate narrative embedding
        const narrative = `${crash.borough || ''} ${crash.on_street_name || ''} ${crash.contributing_factor_vehicle_1 || ''} ${crash.vehicle_type_code1 || ''}`.trim();
        if (narrative) {
          const embedding = await generateEmbedding(narrative);
          if (embedding) {
            crash.narrative_embedding = embedding;
            crash.crash_narrative = narrative;
          }
        }

        await collection.insertOne(crash);
        processed++;
      } catch (error) {
        console.error('Error processing crash:', error);
        errors++;
      }
    }

    res.json({
      success: true,
      processed,
      errors,
      message: `Successfully ingested ${processed} crash records with embeddings`
    });

  } catch (error) {
    console.error('Data ingestion error:', error);
    res.status(500).json({ error: 'Failed to ingest crash data' });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start server
connectToMongoDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SafeStep server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🗺️ Google Cloud integration: ${process.env.GOOGLE_CLOUD_API_KEY ? '✅' : '❌'}`);
    console.log(`🧠 OpenAI integration: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
    console.log(`🍃 MongoDB Atlas: ${process.env.MONGODB_URI ? '✅' : '❌'}`);
  });
});

export default app;