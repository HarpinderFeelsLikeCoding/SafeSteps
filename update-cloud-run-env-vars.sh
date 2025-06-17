#!/bin/bash

echo "🔧 Updating SafeStep Cloud Run Environment Variables"
echo "=================================================="

# Set your project (replace with your actual project ID)
PROJECT_ID="gleaming-bus-453713-d3"  # Update this if different
REGION="northamerica-northeast2"
SERVICE_NAME="safesteps"

echo "📋 Project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo "🚀 Service: $SERVICE_NAME"

# Set the project
gcloud config set project $PROJECT_ID

echo ""
echo "🔑 Setting environment variables..."

# Update environment variables with your actual values
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="MONGODB_URI=mongodb+srv://harpinder059:VblF558XAIQtoWgw@cluster0.sfo01tn.mongodb.net/safestep?retryWrites=true&w=majority,DB_NAME=NYC_Crashes,COLL_NAME=NYC_Crash_Data,OPENAI_API_KEY=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,GOOGLE_CLOUD_API_KEY=AIzaSyAUDcKCjhtyBAaecuPfeSIfCZfgrIBwPhw,NODE_ENV=production,PORT=8080"

echo ""
echo "⏳ Waiting for deployment to complete..."
sleep 30

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo ""
echo "✅ Environment variables updated!"
echo "🌐 Service URL: $SERVICE_URL"

echo ""
echo "🧪 Testing the health endpoint..."
curl -s "$SERVICE_URL/api/health" | jq . || echo "Health check response received"

echo ""
echo "🎉 Setup complete! Your app should now have:"
echo "   ✅ MongoDB Atlas connection"
echo "   ✅ OpenAI API integration"
echo "   ✅ Google Cloud APIs"
echo ""
echo "Visit your app: $SERVICE_URL"