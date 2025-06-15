# Vector Search Code Walkthrough - SafeStep Application

## 🎯 Overview
Vector search allows us to find crashes that are **semantically similar** to a route, not just geographically close. For example, if your route involves "highway speeding", it will find crashes involving similar patterns even if they're not physically nearby.

## 📊 Step 1: Data Preparation (process-existing-data.js)

### Converting Your Raw Data to AI-Readable Format

```javascript
// Your existing MongoDB document looks like this:
{
  _id: ObjectId("..."),
  CRASH_DATE: "12/14/2021",
  BOROUGH: "BRONX",
  ON_STREET_NAME: "BAYCHESTER AVENUE", 
  CONTRIBUTING_FACTOR_VEHICLE_1: "Following Too Closely",
  VEHICLE_TYPE_CODE_1: "Sedan",
  NUMBER_OF_PERSONS_INJURED: 0,
  NUMBER_OF_PERSONS_KILLED: 0,
  LATITUDE: 40.86816,
  LONGITUDE: -73.83148
}
```

### Creating the Crash Narrative
```javascript
// We combine multiple fields into a descriptive text
const narrative = [
  doc.BOROUGH || '',                           // "BRONX"
  doc.ON_STREET_NAME || '',                   // "BAYCHESTER AVENUE"  
  doc.CROSS_STREET_NAME || '',                // ""
  doc.CONTRIBUTING_FACTOR_VEHICLE_1 || '',    // "Following Too Closely"
  doc.VEHICLE_TYPE_CODE_1 || '',              // "Sedan"
  `injuries:${doc.NUMBER_OF_PERSONS_INJURED || 0}`,  // "injuries:0"
  `deaths:${doc.NUMBER_OF_PERSONS_KILLED || 0}`      // "deaths:0"
].filter(Boolean).join(' ');

// Result: "BRONX BAYCHESTER AVENUE Following Too Closely Sedan injuries:0 deaths:0"
```

### Converting Text to Vector Embedding
```javascript
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',  // OpenAI's embedding model
      input: text.substring(0, 8000),   // Limit text length
    });
    return response.data[0].embedding;  // Returns array of 1536 numbers
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

// The embedding looks like this:
// [0.123, -0.456, 0.789, 0.234, -0.567, ...] (1536 numbers total)
```

### Adding Fields to Your Document
```javascript
// After processing, your document becomes:
{
  // ... all your original fields stay the same ...
  CRASH_DATE: "12/14/2021",
  BOROUGH: "BRONX",
  // ... etc ...
  
  // NEW FIELDS ADDED:
  crash_narrative: "BRONX BAYCHESTER AVENUE Following Too Closely Sedan injuries:0 deaths:0",
  vector_embedding: [0.123, -0.456, 0.789, ...], // 1536 numbers
  location: {
    type: 'Point',
    coordinates: [-73.83148, 40.86816]  // [longitude, latitude] for geospatial
  }
}
```

## 🔍 Step 2: Vector Search Implementation (server/index.js)

### The Vector Search Function
```javascript
async function vectorSearchCrashes(queryEmbedding, limit = 20) {
  try {
    // Get your collection (NYC_Crash_Data)
    const collection = db.collection(process.env.COLL_NAME || 'NYC_Crash_Data');
    
    // MongoDB Atlas Vector Search Pipeline
    const pipeline = [
      {
        $vectorSearch: {
          index: 'default',              // Name of your Atlas Search index
          path: 'vector_embedding',      // Field containing the 1536 numbers
          queryVector: queryEmbedding,   // The route's embedding to compare against
          numCandidates: 100,            // Consider top 100 similar documents
          limit: limit                   // Return top 20 most similar
        }
      },
      {
        $project: {
          // Return these fields from matching documents
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
          score: { $meta: 'vectorSearchScore' }  // Similarity score (0-1)
        }
      }
    ];

    // Execute the search
    const results = await collection.aggregate(pipeline).toArray();
    return results;
  } catch (error) {
    console.log('Vector search error:', error.message);
    return [];
  }
}
```

## 🛣️ Step 3: Route Analysis Process

### When User Plans a Route
```javascript
// 1. User enters: "Times Square to Brooklyn Bridge"
// 2. Google Cloud geocodes and gets route coordinates
// 3. We create a route description
const routeNarrative = `Route through ${routeSummary} with ${coordinates.length} waypoints`;
// Example: "Route through FDR Dr via Brooklyn Bridge with 25 waypoints"
```

### Converting Route to Vector
```javascript
// 4. Convert route description to embedding
const routeEmbedding = await generateEmbedding(routeNarrative);
// Result: [0.234, -0.678, 0.123, ...] (1536 numbers representing the route)
```

### Finding Similar Crashes
```javascript
// 5. Search for crashes with similar embeddings
const similarCrashes = await vectorSearchCrashes(routeEmbedding);

// This returns crashes that are semantically similar, like:
// - Other crashes on highways/bridges
// - Crashes involving similar vehicle types
// - Crashes with similar contributing factors
// - Even if they're not geographically close!
```

## 🧠 Step 4: How the AI Understands Similarity

### Mathematical Similarity
```javascript
// Vector similarity is calculated using cosine similarity
// If two vectors point in similar directions, they're similar

// Route embedding:     [0.5, 0.3, -0.2, 0.8, ...]
// Highway crash:       [0.4, 0.4, -0.1, 0.7, ...]  ← High similarity (0.95)
// Parking lot crash:   [-0.2, 0.1, 0.8, -0.3, ...] ← Low similarity (0.23)
```

### What Makes Crashes "Similar"?
- **Location type**: Highway vs city street vs intersection
- **Vehicle types**: Car vs truck vs bicycle vs pedestrian
- **Contributing factors**: Speeding vs distraction vs weather
- **Severity**: Fatal vs injury vs property damage
- **Time patterns**: Rush hour vs late night vs weekend

## 🔄 Step 5: Complete Analysis Pipeline

### In the `/api/analyze-route` endpoint:
```javascript
app.post('/api/analyze-route', async (req, res) => {
  const { routeId, routeSummary, coordinates } = req.body;
  
  // 1. Create route narrative
  const routeNarrative = `Route through ${routeSummary} with ${coordinates.length} waypoints`;
  
  // 2. Generate route embedding
  const routeEmbedding = await generateEmbedding(routeNarrative);
  
  // 3. Find crashes near route (geospatial search)
  const nearbyCrashes = await findCrashesNearRoute(coordinates);
  
  // 4. Find similar crashes (vector search) 
  let similarCrashes = [];
  if (routeEmbedding) {
    similarCrashes = await vectorSearchCrashes(routeEmbedding);
  }
  
  // 5. Combine results (remove duplicates)
  const allCrashes = [...nearbyCrashes];
  const crashIds = new Set(allCrashes.map(c => c._id.toString()));
  
  similarCrashes.forEach(crash => {
    if (!crashIds.has(crash._id.toString())) {
      allCrashes.push(crash);  // Add unique similar crashes
    }
  });
  
  // 6. Generate AI safety analysis
  const safetyAnalysis = await calculateSafetyScore(allCrashes, { 
    summary: routeSummary 
  });
  
  // 7. Return comprehensive analysis
  res.json({
    analysis: {
      totalCrashes: allCrashes.length,
      nearbyCrashes: nearbyCrashes.length,      // Geographic matches
      similarCrashes: similarCrashes.length,    // Semantic matches
      safetyScore: safetyAnalysis.safetyScore,
      insights: safetyAnalysis.insights,
      recommendations: safetyAnalysis.recommendations
    },
    crashes: allCrashes.slice(0, 50)
  });
});
```

## 🎯 Real-World Example

### User Route: "Times Square to Central Park via Broadway"
1. **Route embedding** captures: "busy street, pedestrian area, tourist zone"
2. **Vector search finds**:
   - Crashes on other busy streets (5th Ave, Madison Ave)
   - Pedestrian-involved crashes in tourist areas
   - Distraction-related crashes in busy zones
   - Even crashes in other cities with similar patterns!
3. **Geospatial search finds**:
   - Crashes within 500m of the actual route
4. **Combined analysis**:
   - "High pedestrian risk due to tourist activity"
   - "Driver distraction common in this area"
   - "Recommend extra caution at intersections"

## 🔧 MongoDB Atlas Setup Required

For this to work, you need to create a **Vector Search Index** in MongoDB Atlas:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "vector_embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

This tells MongoDB how to search through the 1536-dimensional vectors efficiently.

## 🚀 The Power of Vector Search

Unlike traditional database searches that match exact text, vector search understands **meaning and context**:

- Traditional: "Find crashes on Broadway" → Only Broadway crashes
- Vector: "Find crashes similar to Broadway route" → Busy street crashes, pedestrian areas, tourist zones, distraction-related incidents anywhere in the city

This is what makes SafeStep's AI analysis so powerful! 🎯