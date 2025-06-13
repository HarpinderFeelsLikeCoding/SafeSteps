# SafeStep - Google Cloud + MongoDB Atlas Hackathon Solution

**Winner of the Devpost "Ready to Build the Future on the Cloud" Hackathon**

SafeStep is an AI-powered navigation application that combines Google Cloud's AI/ML services with MongoDB Atlas's vector search capabilities to provide data-driven safety insights for urban commuters. Built for the hackathon challenge to create innovative solutions using public datasets and cloud technologies.

## 🏆 Hackathon Achievement

**Challenge**: Pick any public dataset and—using Google Cloud's AI/ML services plus MongoDB Atlas's search and vector-search capabilities—build a solution that helps users understand, interact with, or gain new perspectives on that data.

**Solution**: SafeStep ingests the NYC Motor Vehicle Collision dataset into MongoDB Atlas, augments each record with GeoJSON location fields and OpenAI-generated text embeddings, then surfaces that data through both geo-indexing (to query crashes within buffered routes) and k-NN vector indexing (to find semantically similar crash narratives).

## 🚀 Architecture Overview

### Google Cloud Integration
- **Geocoding API**: Translates addresses to coordinates
- **Directions API**: Fetches driving/walking/cycling route geometries
- **Cloud Run**: Secure, scalable deployment platform
- **Cloud Build**: Automated CI/CD pipeline

### MongoDB Atlas Features
- **Vector Search**: k-NN similarity search on crash narratives
- **Geospatial Indexing**: 2dsphere index for location-based queries
- **Atlas Search**: Full-text search capabilities
- **Aggregation Pipeline**: Complex data processing

### AI/ML Stack
- **OpenAI GPT-3.5**: Intelligent safety analysis and recommendations
- **Text Embeddings**: Semantic similarity for crash pattern matching
- **Real-time Analysis**: Dynamic safety scoring based on historical data

## 🛠 Tech Stack

### Backend
- **Node.js + Express**: RESTful API server
- **MongoDB Atlas**: Cloud database with vector search
- **Google Cloud APIs**: Geocoding and Directions
- **OpenAI API**: AI-powered analysis
- **Turf.js**: Geospatial calculations

### Frontend
- **React 18 + TypeScript**: Modern UI framework
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Leaflet**: Interactive mapping
- **Lucide React**: Beautiful icons

### DevOps
- **Docker**: Containerized deployment
- **Cloud Run**: Serverless container platform
- **Cloud Build**: Automated builds and deployments

## 🏗 Key Features

### 1. Intelligent Route Planning
- Multi-modal transportation (driving, walking, cycling)
- Real-time route alternatives with safety scoring
- Google Cloud Directions API integration

### 2. AI-Powered Safety Analysis
- Vector search for semantically similar crash patterns
- GPT-3.5 generated safety insights and recommendations
- Geospatial analysis of crash data near routes

### 3. Interactive Visualization
- Real-time crash data overlay on interactive maps
- Color-coded route safety indicators
- Detailed crash information popups

### 4. Hybrid Search Architecture
- **Geospatial Search**: Find crashes within route buffers
- **Vector Search**: Discover similar crash narratives
- **Combined Analysis**: Comprehensive safety assessment

## 📊 Data Pipeline

### 1. Data Ingestion
```javascript
// NYC Motor Vehicle Collision data processing
const processedCrash = {
  ...rawCrashData,
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  narrative_embedding: await generateEmbedding(crashNarrative),
  crash_narrative: enhancedDescription
};
```

### 2. Vector Search Implementation
```javascript
const pipeline = [
  {
    $vectorSearch: {
      index: 'crash_vector_index',
      path: 'narrative_embedding',
      queryVector: routeEmbedding,
      numCandidates: 100,
      limit: 20
    }
  }
];
```

### 3. Geospatial Queries
```javascript
const crashes = await collection.find({
  location: {
    $geoWithin: {
      $geometry: bufferedRouteGeometry
    }
  }
});
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Cloud account with APIs enabled
- MongoDB Atlas cluster
- OpenAI API key

### 1. Environment Setup
```bash
# Clone the repository
git clone https://github.com/your-username/safestep-hackathon
cd safestep-hackathon

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys
```

### 2. Local Development
```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3000
# API server runs on http://localhost:8080
```

### 3. Data Setup
```bash
# Ingest NYC crash data (sample)
curl -X POST http://localhost:8080/api/ingest-crash-data \
  -H "Content-Type: application/json" \
  -d '{"crashes": [/* your crash data */]}'
```

### 4. Cloud Deployment
```bash
# Build and deploy to Google Cloud Run
gcloud builds submit --config cloudbuild.yaml

# Or use Docker
docker build -t safestep .
docker run -p 8080:8080 safestep
```

## 🔧 API Endpoints

### Health Check
```
GET /api/health
```
Returns service status for MongoDB, OpenAI, and Google Cloud.

### Route Computation
```
POST /api/compute-routes
{
  "origin": "Times Square, NYC",
  "destination": "Brooklyn Bridge, NYC",
  "travelMode": "driving"
}
```
Geocodes addresses, fetches routes, and performs initial safety analysis.

### Route Analysis
```
POST /api/analyze-route
{
  "routeId": "route_0",
  "routeSummary": "Via FDR Drive",
  "coordinates": [[lat, lng], ...]
}
```
Performs hybrid geo+vector search for comprehensive safety analysis.

### Data Ingestion
```
POST /api/ingest-crash-data
{
  "crashes": [/* NYC crash data array */]
}
```
Bulk ingests crash data with automatic embedding generation.

## 🧠 AI Analysis Pipeline

### 1. Route Embedding Generation
```javascript
const routeNarrative = `Route through ${summary} with ${coordinates.length} waypoints`;
const embedding = await openai.embeddings.create({
  model: 'text-embedding-ada-002',
  input: routeNarrative
});
```

### 2. Safety Score Calculation
```javascript
const prompt = `
Analyze this route safety data:
- Total crashes: ${crashes.length}
- Recent crashes: ${recentCrashes.length}
- Fatal crashes: ${fatalCrashes.length}

Provide safety score (0-100) and recommendations.
`;

const analysis = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: prompt }]
});
```

## 📈 Performance Optimizations

### Database Indexing
- **2dsphere index** on location field for geospatial queries
- **Vector search index** on narrative embeddings
- **Compound indexes** on frequently queried fields

### Caching Strategy
- Route computation results cached for 1 hour
- Crash data cached with TTL based on data freshness
- Embedding generation cached to reduce API calls

### Scalability Features
- **Cloud Run autoscaling** based on request volume
- **Connection pooling** for MongoDB Atlas
- **Rate limiting** for external API calls

## 🏅 Hackathon Compliance

### ✅ MongoDB Challenge Requirements
- [x] Uses MongoDB Atlas as primary database
- [x] Implements vector search for semantic similarity
- [x] Utilizes geospatial indexing and queries
- [x] Demonstrates aggregation pipeline usage

### ✅ Google Cloud Integration
- [x] Geocoding API for address resolution
- [x] Directions API for route computation
- [x] Cloud Run for scalable deployment
- [x] Cloud Build for CI/CD automation

### ✅ Public Dataset Usage
- [x] NYC Motor Vehicle Collision dataset
- [x] Data augmentation with AI-generated embeddings
- [x] Real-time data processing and analysis

### ✅ Innovation Criteria
- [x] Novel combination of geo and vector search
- [x] AI-powered safety insights
- [x] Real-world problem solving
- [x] Scalable cloud architecture

## 🎯 Impact & Use Cases

### Urban Planning
- Identify high-risk intersections and corridors
- Data-driven infrastructure improvement recommendations
- Traffic safety policy development

### Personal Safety
- Route optimization for vulnerable road users
- Time-of-day safety recommendations
- Weather and condition-based routing

### Fleet Management
- Commercial vehicle route optimization
- Driver safety training insights
- Insurance risk assessment

## 🔮 Future Enhancements

### Advanced AI Features
- **Predictive Modeling**: Forecast crash likelihood based on conditions
- **Computer Vision**: Analyze street view imagery for safety factors
- **Natural Language Processing**: Extract insights from crash reports

### Enhanced Data Sources
- **Weather Data**: Correlate conditions with crash patterns
- **Traffic Data**: Real-time congestion and safety analysis
- **Construction Data**: Account for temporary hazards

### Mobile Application
- **React Native**: Cross-platform mobile app
- **Offline Capabilities**: Cached routes and safety data
- **Push Notifications**: Real-time safety alerts

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Fork the repository
git clone https://github.com/your-username/safestep-hackathon
cd safestep-hackathon

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push and create pull request
git push origin feature/amazing-feature
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NYC Open Data**: Motor Vehicle Collision dataset
- **Google Cloud**: Geocoding and Directions APIs
- **MongoDB Atlas**: Vector search capabilities
- **OpenAI**: GPT-3.5 and embedding models
- **Devpost**: Hackathon platform and community

---

**Built with ❤️ for the "Ready to Build the Future on the Cloud" Hackathon**

*SafeStep demonstrates the power of combining modern cloud services, AI/ML capabilities, and public datasets to create solutions that make our cities safer and more navigable for everyone.*