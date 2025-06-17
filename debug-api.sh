#!/bin/bash

echo "🔍 SafeStep API Debugging Script"
echo "================================"

# Check if the backend is deployed and responding
echo "1. Testing backend health endpoint..."
curl -s https://safesteps-462919.ue.r.appspot.com/api/health | jq . || echo "❌ Backend not responding or invalid JSON"

echo ""
echo "2. Testing with verbose output..."
curl -v https://safesteps-462919.ue.r.appspot.com/api/health

echo ""
echo "3. Checking App Engine logs..."
echo "Run this command to see recent logs:"
echo "gcloud app logs tail -s default"

echo ""
echo "4. Check environment variables in app.yaml:"
echo "Make sure these are set correctly:"
echo "- MONGODB_URI (should start with mongodb+srv://)"
echo "- OPENAI_API_KEY (should start with sk-)"
echo "- GOOGLE_CLOUD_API_KEY (your Google Cloud API key)"

echo ""
echo "5. Frontend API URL check:"
echo "Make sure your frontend .env has:"
echo "VITE_API_URL=https://safesteps-462919.ue.r.appspot.com/api"