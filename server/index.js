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

// Connect to MongoDB Atlas - Updated for your database structure
async function connectToMongoDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    // Use your actual database name from the screenshot
    db = client.db(process.env.DB_NAME || 'NYC_Crashes');
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${process.env.DB_NAME || 'NYC_Crashes'}`);
    console.log(`📋 Collection: ${process.env.COLL_NAME || 'NYC_Crash_Data'}`);
    
    await ensureIndexes();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Don't exit - allow app to run with demo data
  }
}

// Ensure proper indexes for geo and vector search
async function ensureIndexes() {
  try {
    // Use your actual collection name from the screenshot
    const collection = db.collection(process.env.COLL_NAME || 'NYC_Crash_Data');
    
    // Create geospatial index for location queries
    try {
      await collection.createIndex({ location: '2dsphere' });
      console.log('✅ Geospatial index created');
    } catch (indexError) {
      console.log('ℹ️ Geospatial index already exists or location field not ready');
    }
    
    // Check if vector search index exists
    try {
      const indexes = await collection.listSearchIndexes().toArray();
      const vectorIndex = indexes.find(index => 
        index.name === 'default' || 
        index.mappings?.fields?.vector_embedding ||
        index.mappings?.fields?.narrative_embedding
      );
      
      if (vectorIndex) {
        console.log('✅ Vector search index found and ready');
      } else {
        console.log('⚠️ Vector search index not found');
        console.log('📝 You need to create a vector search index in MongoDB Atlas:');
        console.log('   1. Go to Atlas Search in your cluster');
        console.log('   2. Create Search Index');
        console.log('   3. Use JSON Editor with this config:');
        console.log(JSON.stringify({
          "fields": [
            {
              "type": "vector",
              "path": "vector_embedding",
              "numDimensions": 1536,
              "similarity": "cosine"
            }
          ]
        }, null, 2));
      }
    } catch (indexError) {
      console.log('ℹ️ Vector search index check skipped - will use geospatial search only');
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
      input: text.substring(0, 8000),
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
    // Return demo coordinates for NYC if geocoding fails
    if (address.toLowerCase().includes('times square')) {
      return { lat: 40.7580, lng: -73.9855, formatted_address: 'Times Square, New York, NY' };
    }
    if (address.toLowerCase().includes('brooklyn bridge')) {
      return { lat: 40.7061, lng: -73.9969, formatted_address: 'Brooklyn Bridge, New York, NY' };
    }
    return { lat: 40.7128, lng: -74.0060, formatted_address: address };
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
    // Return demo route if API fails
    return [{
      id: 'route_0',
      summary: 'Demo Route via Broadway',
      distance: { text: '2.1 mi', value: 3380 },
      duration: { text: '12 mins', value: 720 },
      polyline: 'demo_polyline',
      bounds: {},
      legs: []
    }];
  }
}

// Decode Google polyline to coordinates
function decodePolyline(encoded) {
  if (encoded === 'demo_polyline') {
    // Return demo coordinates for Times Square to Brooklyn Bridge
    return [
      [40.7580, -73.9855], // Times Square
      [40.7505, -73.9934], // Herald Square
      [40.7282, -73.9942], // Union Square
      [40.7061, -73.9969]  // Brooklyn Bridge
    ];
  }
  
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

// Demo crash data for when database is not available
const demoCrashes = [
  {
    _id: 'demo1',
    CRASH_DATE: '12/01/2023',
    BOROUGH: 'MANHATTAN',
    ON_STREET_NAME: 'BROADWAY',
    LATITUDE: 40.7580,
    LONGITUDE: -73.9855,
    NUMBER_OF_PERSONS_INJURED: 1,
    NUMBER_OF_PERSONS_KILLED: 0,
    VEHICLE_TYPE_CODE_1: 'SEDAN',
    CONTRIBUTING_FACTOR_VEHICLE_1: 'DRIVER INATTENTION/DISTRACTION'
  },
  {
    _id: 'demo2',
    CRASH_DATE: '12/02/2023',
    BOROUGH: 'MANHATTAN',
    ON_STREET_NAME: '5 AVENUE',
    LATITUDE: 40.7505,
    LONGITUDE: -73.9934,
    NUMBER_OF_PERSONS_INJURED: 0,
    NUMBER_OF_PERSONS_KILLED: 1,
    VEHICLE_TYPE_CODE_1: 'SUV',
    CONTRIBUTING_FACTOR_VEHICLE_1: 'FAILURE TO YIELD RIGHT-OF-WAY'
  }
];

// Find crashes near route using geospatial query - Updated for your field names
async function findCrashesNearRoute(routeCoordinates, bufferKm = 0.5) {
  try {
    if (!db) {
      console.log('ℹ️ Database not available, using demo crash data');
      return demoCrashes;
    }
    
    const collection = db.collection(process.env.COLL_NAME || 'NYC_Crash_Data');
    
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

    return crashes.length > 0 ? crashes : demoCrashes;
  } catch (error) {
    console.error('Error finding crashes near route:', error);
    return demoCrashes;
  }
}

// Vector search for similar crash narratives - Updated for your collection
async function vectorSearchCrashes(queryEmbedding, limit = 20) {
  try {
    if (!db) {
      console.log('ℹ️ Database not available for vector search');
      return [];
    }
    
    const collection = db.collection(process.env.COLL_NAME || 'NYC_Crash_Data');
    
    const pipeline = [
      {
        $vectorSearch: {
          index: 'default',
          path: 'vector_embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: limit
        }
      },
      {
        $project: {
          _id: 1,
          CRASH_DATE: 1,
          CRASH_TIME: 1,
          BOROUGH: 1,
          ON_STREET_NAME: 1,
          CROSS_STREET_NAME: 1,
          LATITUDE: 1,
          LONGITUDE: 1,
          NUMBER_OF_PERSONS_INJURED: 1,
          NUMBER_OF_PERSONS_KILLED: 1,
          VEHICLE_TYPE_CODE_1: 1,
          CONTRIBUTING_FACTOR_VEHICLE_1: 1,
          crash_narrative: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return results;
  } catch (error) {
    console.log('ℹ️ Vector search not available yet - using geospatial search only');
    console.log('Vector search error:', error.message);
    return [];
  }
}

// Calculate safety score using AI analysis - Updated for your field names
async function calculateSafetyScore(crashes, routeInfo) {
  try {
    const recentCrashes = crashes.filter(crash => {
      const crashDate = new Date(crash.CRASH_DATE || crash.crash_date);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return crashDate >= sixMonthsAgo;
    });

    const fatalCrashes = crashes.filter(crash => 
      (crash.NUMBER_OF_PERSONS_KILLED || crash.number_of_persons_killed || 0) > 0
    );
    const injuryCrashes = crashes.filter(crash => 
      (crash.NUMBER_OF_PERSONS_INJURED || crash.number_of_persons_injured || 0) > 0
    );

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
    
    Top contributing factors: ${[...new Set(crashes.map(c => 
      c.CONTRIBUTING_FACTOR_VEHICLE_1 || c.contributing_factor_vehicle_1
    ).filter(Boolean))].slice(0, 5).join(', ')}
    
    Vehicle types involved: ${[...new Set(crashes.map(c => 
      c.VEHICLE_TYPE_CODE_1 || c.vehicle_type_code1
    ).filter(Boolean))].slice(0, 5).join(', ')}
    
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
    const fatalPenalty = crashes.filter(c => 
      (c.NUMBER_OF_PERSONS_KILLED || c.number_of_persons_killed || 0) > 0
    ).length * 10;
    const finalScore = Math.max(10, baseScore - crashPenalty - fatalPenalty);
    
    return {
      safetyScore: finalScore,
      riskLevel: finalScore >= 70 ? 'low' : finalScore >= 50 ? 'medium' : 'high',
      insights: ['Analysis based on crash frequency and severity', 'Demo mode - limited data available'],
      recommendations: ['Exercise caution in high-traffic areas', 'Maintain safe following distance'],
      keyRisks: ['Traffic congestion', 'Intersection safety']
    };
  }
}

// API Routes

// Health check endpoint - Updated to check your collection
app.get('/api/health', async (req, res) => {
  try {
    const mongoStatus = db ? 'connected' : 'disconnected';
    const openaiStatus = process.env.OPENAI_API_KEY ? 'configured' : 'not configured';
    const googleStatus = process.env.GOOGLE_CLOUD_API_KEY ? 'configured' : 'not configured';
    
    // Test MongoDB connection and check data
    let dataStatus = 'no data';
    if (db) {
      await db.admin().ping();
      const collection = db.collection(process.env.COLL_NAME || 'NYC_Crash_Data');
      const totalDocs = await collection.countDocuments();
      const processedDocs = await collection.countDocuments({ 
        vector_embedding: { $exists: true } 
      });
      dataStatus = `${totalDocs} total, ${processedDocs} with embeddings`;
    }
    
    res.json({
      status: 'healthy',
      services: {
        mongodb: mongoStatus,
        openai: openaiStatus,
        googleCloud: googleStatus
      },
      data: dataStatus,
      database: process.env.DB_NAME || 'NYC_Crashes',
      collection: process.env.COLL_NAME || 'NYC_Crash_Data',
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
    
    console.log(`🗺️ Computing routes: ${origin} → ${destination} (${travelMode})`);
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    // Geocode addresses
    const originCoords = await geocodeAddress(origin);
    const destCoords = await geocodeAddress(destination);
    
    if (!originCoords || !destCoords) {
      return res.status(400).json({ error: 'Could not geocode addresses' });
    }

    console.log(`📍 Origin: ${originCoords.lat}, ${originCoords.lng}`);
    console.log(`📍 Destination: ${destCoords.lat}, ${destCoords.lng}`);

    // Get route alternatives
    const routes = await getRouteDirections(originCoords, destCoords, travelMode);
    
    if (routes.length === 0) {
      return res.status(404).json({ error: 'No routes found' });
    }

    console.log(`🛣️ Found ${routes.length} route(s)`);

    // Process each route
    const processedRoutes = await Promise.all(routes.map(async (route, index) => {
      const coordinates = decodePolyline(route.polyline);
      
      console.log(`🔍 Analyzing route ${index + 1} with ${coordinates.length} coordinates`);
      
      // Find crashes near this route
      const crashes = await findCrashesNearRoute(coordinates);
      
      console.log(`💥 Found ${crashes.length} crashes near route ${index + 1}`);
      
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
    
    console.log(`✅ Route computation complete. Safest route: ${sortedRoutes[0]?.safetyScore}% safe`);
    
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
    res.status(500).json({ error: 'Failed to compute routes', details: error.message });
  }
});

// Route analysis endpoint with vector search
app.post('/api/analyze-route', async (req, res) => {
  try {
    const { routeId, routeSummary, coordinates } = req.body;
    
    console.log(`🧠 Analyzing route: ${routeId} - ${routeSummary}`);
    
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

    console.log(`📊 Analysis complete: ${allCrashes.length} total crashes (${nearbyCrashes.length} nearby, ${similarCrashes.length} similar)`);

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
    res.status(500).json({ error: 'Failed to analyze route', details: error.message });
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