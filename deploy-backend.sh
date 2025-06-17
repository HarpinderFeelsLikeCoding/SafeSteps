#!/bin/bash

# SafeStep Backend Deployment Script for Google Cloud

echo "🚀 Starting SafeStep Backend Deployment to Google Cloud..."

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

# Set project (you'll need to replace this with your project ID)
echo "📋 Please enter your Google Cloud Project ID:"
read -p "Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID is required"
    exit 1
fi

gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required Google Cloud APIs..."
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable geocoding-backend.googleapis.com
gcloud services enable directions-backend.googleapis.com

# Create App Engine app if it doesn't exist
echo "🏗️ Setting up App Engine..."
if ! gcloud app describe &> /dev/null; then
    echo "📍 Please choose a region for your App Engine app:"
    echo "   Recommended: us-central (Iowa) or us-east1 (South Carolina)"
    read -p "Region: " REGION
    gcloud app create --region=$REGION
fi

# Update environment variables
echo "🔑 Please update the environment variables in app.yaml:"
echo "   - MONGODB_URI: Your MongoDB Atlas connection string"
echo "   - OPENAI_API_KEY: Your OpenAI API key"
echo "   - GOOGLE_CLOUD_API_KEY: Your Google Cloud API key"
echo ""
read -p "Press Enter when you've updated app.yaml..."

# Deploy to App Engine
echo "🚀 Deploying to Google App Engine..."
gcloud app deploy app.yaml --quiet

# Get the deployed URL
APP_URL=$(gcloud app describe --format="value(defaultHostname)")
echo ""
echo "✅ Deployment successful!"
echo "🌐 Your backend is now available at: https://$APP_URL"
echo ""
echo "📝 Next steps:"
echo "   1. Update your frontend VITE_API_URL to: https://$APP_URL/api"
echo "   2. Test the health endpoint: https://$APP_URL/api/health"
echo "   3. Redeploy your frontend with the new API URL"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: gcloud app logs tail -s default"
echo "   Open in browser: gcloud app browse"
echo "   Deploy updates: gcloud app deploy"