import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB and OpenAI clients
let db;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(process.env.ATLAS_URI);
    await client.connect();
    db = client.db('safestep');
    console.log('Connected to MongoDB Atlas');
    
    // Ensure vector search index exists
    await ensureVectorSearchIndex();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Ensure vector search index exists
async function ensureVectorSearchIndex() {
  try {
    const collection = db.collection('crash_data');
    
    // Check if vector search index exists
    const indexes = await collection.listSearchIndexes().toArray();
    const vectorIndex = indexes.find(index => index.name === 'vector_index');
    
    if (!vectorIndex) {
      console.log('Creating vector search index...');
      await collection.createSearchIndex({
        name: 'vector_index',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'location_embedding',
              numDimensions: 1536,
              similarity: 'cosine'
            },
            {
              type: 'filter',
              path: 'borough'
            },
            {
              type: 'filter',
              path: 'crash_date'
            }
          ]
        }
      });
      console.log('Vector search index created');
    }
  } catch (error) {
    console.error('Error setting up vector search index:', error);
  }
}

// Generate embeddings for location data
async function generateLocationEmbedding(locationText) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: locationText,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

// Vector search for similar locations
async function vectorSearchCrashData(queryEmbedding, limit = 50) {
  try {
    const collection = db.collection('crash_data');
    
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'location_embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: limit
        }
      },
      {
        $project: {
          _id: 1,
          borough: 1,
          on_street_name: 1,
          cross_street_name: 1,
          crash_date: 1,
          crash_time: 1,
          latitude: 1,
          longitude: 1,
          vehicle_types: 1,
          contributing_factors: 1,
          injuries_total: 1,
          deaths_total: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return results;
  } catch (error) {
    console.error('Vector search error:', error);
    return [];
  }
}

// Calculate safety score using AI
async function calculateSafetyScore(crashData, routeInfo) {
  try {
    const prompt = `
    Analyze the following crash data and route information to calculate a safety score (0-100):
    
    Route: ${routeInfo.origin} to ${routeInfo.destination}
    Distance: ${routeInfo.distance}
    
    Crash Data Summary:
    - Total incidents: ${crashData.length}
    - Recent incidents (last 30 days): ${crashData.filter(crash => {
      const crashDate = new Date(crash.crash_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return crashDate >= thirtyDaysAgo;
    }).length}
    - Fatal incidents: ${crashData.filter(crash => crash.deaths_total > 0).length}
    - Injury incidents: ${crashData.filter(crash => crash.injuries_total > 0).length}
    
    Consider factors like:
    - Frequency of accidents
    - Severity of incidents
    - Time patterns
    - Location density
    
    Respond with only a JSON object containing:
    {
      "safetyScore": number (0-100),
      "riskLevel": "low" | "medium" | "high",
      "insights": ["insight1", "insight2", ...],
      "recommendations": ["rec1", "rec2", ...]
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
    return {
      safetyScore: 75,
      riskLevel: 'medium',
      insights: ['Unable to analyze at this time'],
      recommendations: ['Exercise normal caution']
    };
  }
}

// API Routes

// Search crash data by location
app.post('/api/search-crashes', async (req, res) => {
  try {
    const { query, origin, destination } = req.body;
    
    // Generate embedding for the search query
    const searchText = `${origin} ${destination} ${query}`.trim();
    const queryEmbedding = await generateLocationEmbedding(searchText);
    
    if (!queryEmbedding) {
      return res.status(500).json({ error: 'Failed to generate search embedding' });
    }

    // Perform vector search
    const crashData = await vectorSearchCrashData(queryEmbedding);
    
    // Calculate safety analysis
    const safetyAnalysis = await calculateSafetyScore(crashData, {
      origin,
      destination,
      distance: 'calculating...'
    });

    res.json({
      crashData,
      safetyAnalysis,
      totalResults: crashData.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Add crash data with embeddings
app.post('/api/add-crash-data', async (req, res) => {
  try {
    const crashData = req.body;
    
    // Generate location embedding
    const locationText = `${crashData.borough} ${crashData.on_street_name} ${crashData.cross_street_name}`.trim();
    const embedding = await generateLocationEmbedding(locationText);
    
    if (embedding) {
      crashData.location_embedding = embedding;
    }
    
    const collection = db.collection('crash_data');
    const result = await collection.insertOne(crashData);
    
    res.json({ success: true, insertedId: result.insertedId });
  } catch (error) {
    console.error('Error adding crash data:', error);
    res.status(500).json({ error: 'Failed to add crash data' });
  }
});

// Bulk process existing data to add embeddings
app.post('/api/process-embeddings', async (req, res) => {
  try {
    const collection = db.collection('crash_data');
    
    // Find documents without embeddings
    const documentsToProcess = await collection.find({
      location_embedding: { $exists: false }
    }).limit(100).toArray();
    
    console.log(`Processing ${documentsToProcess.length} documents...`);
    
    for (const doc of documentsToProcess) {
      const locationText = `${doc.borough || ''} ${doc.on_street_name || ''} ${doc.cross_street_name || ''}`.trim();
      
      if (locationText) {
        const embedding = await generateLocationEmbedding(locationText);
        
        if (embedding) {
          await collection.updateOne(
            { _id: doc._id },
            { $set: { location_embedding: embedding } }
          );
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    res.json({ 
      success: true, 
      processed: documentsToProcess.length,
      message: 'Embeddings processed successfully'
    });
  } catch (error) {
    console.error('Error processing embeddings:', error);
    res.status(500).json({ error: 'Failed to process embeddings' });
  }
});

// Get route safety analysis
app.post('/api/analyze-route', async (req, res) => {
  try {
    const { coordinates, origin, destination } = req.body;
    
    // Generate embeddings for route points
    const routeText = `route from ${origin} to ${destination}`;
    const queryEmbedding = await generateLocationEmbedding(routeText);
    
    if (!queryEmbedding) {
      return res.status(500).json({ error: 'Failed to analyze route' });
    }

    // Search for crashes near the route
    const crashData = await vectorSearchCrashData(queryEmbedding, 100);
    
    // Filter crashes that are geographically close to the route
    const routeCrashes = crashData.filter(crash => {
      if (!crash.latitude || !crash.longitude) return false;
      
      // Simple distance check - in a real app, you'd use proper route proximity
      return coordinates.some(coord => {
        const distance = Math.sqrt(
          Math.pow(coord[0] - crash.latitude, 2) + 
          Math.pow(coord[1] - crash.longitude, 2)
        );
        return distance < 0.01; // Roughly 1km
      });
    });

    // Calculate safety score
    const safetyAnalysis = await calculateSafetyScore(routeCrashes, {
      origin,
      destination,
      distance: `${coordinates.length} points`
    });

    res.json({
      crashData: routeCrashes,
      safetyAnalysis,
      routeAnalysis: {
        totalCrashes: routeCrashes.length,
        recentCrashes: routeCrashes.filter(crash => {
          const crashDate = new Date(crash.crash_date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return crashDate >= thirtyDaysAgo;
        }).length
      }
    });
  } catch (error) {
    console.error('Route analysis error:', error);
    res.status(500).json({ error: 'Route analysis failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    mongodb: db ? 'connected' : 'disconnected',
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
  });
});

// Start server
connectToMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
});

export default app;