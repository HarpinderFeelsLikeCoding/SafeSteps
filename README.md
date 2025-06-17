# SafeStep - AI-Powered Route Safety Analysis

SafeStep is an intelligent navigation application that uses AI and real-time data to provide safety-focused route recommendations. Built with React, Node.js, and integrated with Google Cloud, MongoDB Atlas, and OpenAI.

## 🚀 Features

- **AI-Powered Safety Analysis**: Uses OpenAI to analyze crash patterns and provide safety insights
- **Real-Time Route Planning**: Google Cloud Directions API for accurate routing
- **Interactive Maps**: Leaflet-based mapping with crash data visualization
- **Hybrid Search**: Combines geospatial and vector search for comprehensive analysis
- **Responsive Design**: Works on desktop and mobile devices

## 🛠 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Leaflet (maps)
- Lucide React (icons)

### Backend
- Node.js + Express
- MongoDB Atlas (database + vector search)
- OpenAI API (AI analysis)
- Google Cloud APIs (geocoding + directions)

## 🏗 Project Structure

```
safestep/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── services/          # API service layer
│   ├── types/             # TypeScript type definitions
│   └── App.tsx            # Main application component
├── server/                # Backend Node.js server
│   └── index.js          # Express server with all APIs
├── dist/                  # Built frontend (generated)
└── package.json          # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (optional - has demo mode)
- OpenAI API key (optional - has fallback)
- Google Cloud API key (optional - has demo routes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file or set these in your deployment platform:

```bash
# MongoDB Atlas (optional)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safestep
DB_NAME=NYC_Crashes
COLL_NAME=NYC_Crash_Data

# OpenAI API (optional)
OPENAI_API_KEY=sk-proj-your-openai-key

# Google Cloud API (optional)
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key

# Server Config
NODE_ENV=production
PORT=8080
```

### 3. Development
```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run client  # Frontend on :3000
npm run server  # Backend on :8080
```

### 4. Production Build
```bash
npm run build
npm start
```

## 🌐 Deployment

### Google Cloud Run
The app is configured for Google Cloud Run deployment:

1. **Set Environment Variables** in Cloud Run console:
   - Go to Cloud Run → Your Service → Edit & Deploy New Revision
   - Add environment variables in "Variables & Secrets" tab
   - Deploy the new revision

2. **Common Issue**: Environment variables not being read
   - Make sure variables are set in the Cloud Run service (not just Cloud Build)
   - Check that variable names match exactly (case-sensitive)
   - Verify the service is using the latest revision

### Other Platforms
- **Netlify/Vercel**: Frontend only (set `VITE_API_URL`)
- **Railway/Render**: Full-stack deployment
- **Docker**: Use included Dockerfile

## 🔧 API Endpoints

### Health Check
```
GET /api/health
```
Returns service status and configuration.

### Route Planning
```
POST /api/compute-routes
{
  "origin": "Times Square, NYC",
  "destination": "Brooklyn Bridge, NYC", 
  "travelMode": "driving"
}
```

### Route Analysis
```
POST /api/analyze-route
{
  "routeId": "route_0",
  "routeSummary": "Via FDR Drive",
  "coordinates": [[lat, lng], ...]
}
```

## 🧠 How It Works

1. **Route Computation**: Uses Google Directions API to get multiple route options
2. **Crash Data Analysis**: Queries MongoDB for crashes near each route using geospatial indexing
3. **AI Safety Scoring**: OpenAI analyzes crash patterns and provides safety recommendations
4. **Vector Search**: Finds semantically similar crash narratives using embeddings
5. **Real-time Visualization**: Displays routes and crash data on interactive maps

## 🔒 Security & Privacy

- No personal data stored
- API keys secured via environment variables
- CORS configured for secure cross-origin requests
- Rate limiting on external API calls

## 🐛 Troubleshooting

### "API connection failed - using demo mode"
- Check that environment variables are set correctly
- Verify API keys are valid and have proper permissions
- Ensure MongoDB Atlas allows connections from your deployment IP

### Routes not loading
- Check Google Cloud API key has Directions API enabled
- Verify Geocoding API is enabled for address resolution
- Check API quotas and billing

### Database connection issues
- Verify MongoDB Atlas connection string format
- Check IP whitelist (use 0.0.0.0/0 for cloud deployments)
- Ensure database and collection names match environment variables

## 📊 Demo Mode

The app gracefully degrades when external services aren't available:
- **No MongoDB**: Uses demo crash data
- **No OpenAI**: Uses fallback safety calculations  
- **No Google APIs**: Uses demo routes and coordinates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built for safer urban navigation through AI and data-driven insights.**