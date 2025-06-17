#!/bin/bash

echo "🚀 SafeStep - Direct Cloud Run Deployment"
echo "========================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "📋 Please set your Google Cloud Project ID:"
    read -p "Project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
fi

echo "📦 Project: $PROJECT_ID"
REGION="northamerica-northeast2"
SERVICE_NAME="safesteps"

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy directly (bypassing git issues)
echo "🏗️ Building and deploying directly..."

# Method 1: Direct deployment from source
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10 \
  --timeout=900 \
  --concurrency=80 \
  --min-instances=0 \
  --execution-environment=gen2 \
  --set-env-vars="NODE_ENV=production,PORT=8080,MONGODB_URI=mongodb+srv://harpinder059:VblF558XAIQtoWgw@cluster0.sfo01tn.mongodb.net/safestep?retryWrites=true&w=majority,DB_NAME=NYC_Crashes,COLL_NAME=NYC_Crash_Data,OPENAI_API_KEY=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,GOOGLE_CLOUD_API_KEY=AIzaSyAUDcKCjhtyBAaecuPfeSIfCZfgrIBwPhw"

# Get the service URL
echo "🔍 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "⚠️ Could not get service URL. Checking deployment status..."
    gcloud run services list --region=$REGION
else
    echo ""
    echo "✅ Deployment successful!"
    echo "🌐 Your app is live at: $SERVICE_URL"
    echo ""
    echo "🧪 Testing the deployment..."
    curl -s "$SERVICE_URL/api/health" | head -c 200
    echo ""
    echo ""
    echo "🎉 All done! Your SafeStep app should now be fully functional!"
fi