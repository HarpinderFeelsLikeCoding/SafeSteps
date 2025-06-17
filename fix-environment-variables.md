# Fix Cloud Run Environment Variables 🔧

Your SafeStep app is deployed but needs environment variables configured. Here's how to fix it:

## 🚨 Current Issue
The app is running in demo mode because environment variables aren't set in Cloud Run.

## 🔧 Quick Fix - Set Environment Variables

### Method 1: Google Cloud Console (Recommended)
1. **Go to [Cloud Run Console](https://console.cloud.google.com/run)**
2. **Click on your `safesteps` service**
3. **Click "EDIT & DEPLOY NEW REVISION"**
4. **Go to "Variables & Secrets" tab**
5. **Add these environment variables:**

```bash
# MongoDB Atlas (if you have it)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safestep?retryWrites=true&w=majority
DB_NAME=NYC_Crashes
COLL_NAME=NYC_Crash_Data

# OpenAI API Key (if you have it)
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here

# Google Cloud API Key (if you have it)
GOOGLE_CLOUD_API_KEY=your-actual-google-cloud-api-key-here

# Server Config (already set)
NODE_ENV=production
PORT=8080
```

6. **Click "DEPLOY"**

### Method 2: Command Line
```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Update environment variables (replace with your actual values)
gcloud run services update safesteps \
  --region=northamerica-northeast2 \
  --set-env-vars="MONGODB_URI=your-mongodb-uri,OPENAI_API_KEY=your-openai-key,GOOGLE_CLOUD_API_KEY=your-google-key"
```

## 🎯 Test Your Deployment

### 1. Check Health Endpoint
```bash
curl https://safesteps-[your-hash].a.run.app/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "services": {
    "mongodb": "connected",
    "openai": "configured",
    "googleCloud": "configured"
  }
}
```

### 2. Test the App
Visit your Cloud Run URL in a browser and try planning a route.

## 🆘 If Still Not Working

### Check Logs
```bash
gcloud run logs tail --service=safesteps --region=northamerica-northeast2
```

### Common Issues:
1. **Container not starting**: Check build logs
2. **Environment variables not set**: Follow steps above
3. **API keys invalid**: Verify your keys are correct
4. **MongoDB connection**: Check connection string format

## 🎉 Demo Mode
Even without API keys, your app should work in demo mode with:
- ✅ Basic route planning
- ✅ Demo crash data
- ✅ Fallback safety analysis

The app is designed to be resilient and work even without external services!