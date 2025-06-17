#!/bin/bash

# SafeStep Deployment to Google Cloud Run

echo "🚀 Deploying SafeStep to Google Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
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

# Build and deploy using Cloud Build
echo "🏗️ Building and deploying with Cloud Build..."
gcloud builds submit --config cloudbuild.yaml

# Get the service URL
SERVICE_URL=$(gcloud run services describe safestep --region=us-central1 --format="value(status.url)")

echo ""
echo "✅ Deployment successful!"
echo "🌐 Your app is live at: $SERVICE_URL"
echo ""
echo "📝 Next steps:"
echo "   1. Test the health endpoint: $SERVICE_URL/api/health"
echo "   2. Update your frontend VITE_API_URL to: $SERVICE_URL/api"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: gcloud run logs tail --service=safestep --region=us-central1"
echo "   Update service: gcloud run deploy safestep --region=us-central1"