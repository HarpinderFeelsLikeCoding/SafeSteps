// Update your .env file to match your MongoDB structure
import fs from 'fs';

const envContent = `# MongoDB Atlas Configuration - Updated for your existing data
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/NYC_Crashes?retryWrites=true&w=majority

# Database and Collection names (matching your screenshot)
DB_NAME=NYC_Crashes
COLL_NAME=NYC_Crash_Data

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Google Cloud Configuration
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key-here

# Server Configuration
PORT=8080
NODE_ENV=production

# Frontend Configuration (for local development)
VITE_API_URL=http://localhost:8080
`;

console.log('📝 Updated .env template for your existing MongoDB structure:');
console.log(envContent);
console.log('\n⚠️  Make sure to update your actual .env file with:');
console.log('1. Your real MongoDB connection string');
console.log('2. Your OpenAI API key');
console.log('3. Your Google Cloud API key');