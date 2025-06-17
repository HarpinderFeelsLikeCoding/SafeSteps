#!/bin/bash

echo "🚀 SafeStep Vercel Deployment Guide"
echo "==================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

echo ""
echo "🔧 Pre-deployment checklist:"
echo "1. ✅ Build the project locally"
echo "2. ✅ Test the build"
echo "3. ✅ Configure environment variables"
echo "4. ✅ Deploy to Vercel"

echo ""
echo "📋 Step 1: Build the project"
npm run build:client

echo ""
echo "📋 Step 2: Deploy to Vercel"
echo "Run: vercel --prod"
echo ""
echo "📋 Step 3: Set environment variables in Vercel dashboard:"
echo "- VITE_API_URL: Your backend API URL"
echo ""
echo "🌐 Your app will be available at: https://your-app-name.vercel.app"
echo ""
echo "💡 Tips:"
echo "- Connect your GitHub repo for auto-deployments"
echo "- Use Vercel's serverless functions for backend if needed"
echo "- Enable preview deployments for testing"