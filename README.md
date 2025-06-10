# SafeStep - AI-Powered Safe Navigation

SafeStep is an intelligent navigation application that uses MongoDB Atlas Vector Search and OpenAI to provide safety-focused route recommendations based on real crash data analysis.

## Features

- **AI-Powered Safety Analysis**: Uses OpenAI GPT-3.5 to analyze crash data and provide intelligent safety insights
- **Vector Search**: MongoDB Atlas Vector Search for efficient similarity-based crash data retrieval
- **Real-time Route Analysis**: Dynamic safety scoring based on historical accident data
- **Interactive Map**: Leaflet-based mapping with crash data visualization
- **Multiple Route Options**: Compare fastest, safest, and balanced route alternatives

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Leaflet & React-Leaflet for mapping
- Lucide React for icons

### Backend
- Node.js with Express
- MongoDB Atlas with Vector Search
- OpenAI API for intelligent analysis
- CORS enabled for cross-origin requests

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account with a cluster
- OpenAI API key

### 1. Environment Configuration

Create a `.env` file in the root directory:

```env
# MongoDB Atlas Configuration
ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/safestep?retryWrites=true&w=majority

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend API URL
VITE_API_URL=http://localhost:5000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Create a database named `safestep`
3. Create a collection named `crash_data`
4. The application will automatically create the vector search index on first run

### 4. Data Setup

To populate your database with crash data:

```bash
# Use the /api/setup-data endpoint to bulk insert crash data with embeddings
# This will process your crash data and generate location embeddings
```

### 5. Run the Application

Start the backend server:
```bash
npm run server
```

Start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /health` - Check MongoDB and OpenAI connection status

### Crash Data Search
- `POST /api/search-crashes` - Vector search for crashes based on route
- `POST /api/analyze-route` - Analyze specific route coordinates
- `POST /api/setup-data` - Bulk insert crash data with embeddings

## MongoDB Vector Search

The application uses MongoDB Atlas Vector Search with:
- **Model**: OpenAI text-embedding-ada-002 (1536 dimensions)
- **Similarity**: Cosine similarity
- **Index**: Covers location embeddings and filterable fields

## AI Analysis

OpenAI GPT-3.5 provides:
- Safety score calculation (0-100)
- Risk level assessment (low/medium/high)
- Contextual safety insights
- Personalized recommendations

## Development

### Project Structure
```
src/
├── components/          # React components
├── services/           # API service layer
├── types/              # TypeScript type definitions
└── App.tsx            # Main application component

server/
└── index.js           # Express server with MongoDB and OpenAI integration
```

### Key Features Implementation

1. **Vector Search**: Location text is embedded using OpenAI and stored in MongoDB for similarity search
2. **Real-time Analysis**: Routes are analyzed against historical crash data in real-time
3. **AI Insights**: OpenAI analyzes crash patterns to provide contextual safety recommendations
4. **Responsive Design**: Mobile-first design with Tailwind CSS

## Hackathon Notes

This project demonstrates:
- Advanced MongoDB Atlas Vector Search capabilities
- OpenAI integration for intelligent data analysis
- Real-time geospatial data processing
- Modern React/TypeScript frontend architecture
- RESTful API design with Express.js

Perfect for showcasing AI-powered applications with real-world safety impact!