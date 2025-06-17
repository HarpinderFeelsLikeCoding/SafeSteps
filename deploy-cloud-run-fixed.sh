#!/bin/bash

echo "🚀 SafeStep - Fixed Cloud Run Deployment Script"
echo "==============================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "🔐 Please authenticate with Google Cloud:"
    gcloud auth login
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "📋 Please set your Google Cloud Project ID:"
    read -p "Project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
fi

echo "📦 Project: $PROJECT_ID"

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Set the region
REGION="northamerica-northeast2"
echo "🌍 Using region: $REGION"

# Build and deploy using Cloud Build
echo "🏗️ Building and deploying with Cloud Build..."
echo "This may take 10-15 minutes..."

gcloud builds submit --config cloudbuild.yaml --timeout=3600s

# Get the service URL
echo "🔍 Getting service URL..."
SERVICE_URL=$(gcloud run services describe safesteps --region=$REGION --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "⚠️ Could not get service URL. Checking deployment status..."
    gcloud run services list --region=$REGION
    echo ""
    echo "If the service exists, you can get the URL with:"
    echo "gcloud run services describe safesteps --region=$REGION --format='value(status.url)'"
else
    echo ""
    echo "✅ Deployment successful!"
    echo "🌐 Your app is live at: $SERVICE_URL"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test the health endpoint: $SERVICE_URL/api/health"
    echo "   2. Test the main app: $SERVICE_URL"
    echo "   3. Set environment variables if needed"
    echo ""
    echo "🔧 Useful commands:"
    echo "   View logs: gcloud run logs tail --service=safesteps --region=$REGION"
    echo "   Update service: gcloud run deploy safesteps --region=$REGION"
    echo "   Set env vars: gcloud run services update safesteps --region=$REGION --set-env-vars='KEY=value'"
fi

echo ""
echo "🔍 Testing the deployment..."
if [ ! -z "$SERVICE_URL" ]; then
    echo "Testing health endpoint..."
    curl -s "$SERVICE_URL/api/health" | head -c 200
    echo ""
fi

echo ""
echo "🎉 Deployment script completed!"