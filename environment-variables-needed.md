# SafeStep Environment Variables - Exact Requirements 🔑

Based on your `server/index.js` code, here are the **exact environment variables** you need to configure in Google Cloud Run to get those 3 red dots to turn green:

## 🚨 Required Environment Variables

### 1. MongoDB Atlas Connection
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
DB_NAME=NYC_Crashes
COLL_NAME=NYC_Crash_Data
```

### 2. OpenAI API Key
```bash
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
```

### 3. Google Cloud API Key
```bash
GOOGLE_CLOUD_API_KEY=your-actual-google-cloud-api-key-here
```

### 4. Server Configuration (Already Set)
```bash
NODE_ENV=production
PORT=8080
```

## 🎯 How to Set These in Google Cloud Run

### Step 1: Go to Cloud Run
1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Run** in the left sidebar
3. Click on your **`safesteps`** service

### Step 2: Edit Environment Variables
1. Click **"EDIT & DEPLOY NEW REVISION"** button
2. Click on the **"Variables & Secrets"** tab
3. In the "Environment variables" section, click **"ADD VARIABLE"** for each:

```
Variable Name: MONGODB_URI
Value: [Your MongoDB Atlas connection string]

Variable Name: DB_NAME
Value: NYC_Crashes

Variable Name: COLL_NAME
Value: NYC_Crash_Data

Variable Name: OPENAI_API_KEY
Value: [Your OpenAI API key starting with sk-]

Variable Name: GOOGLE_CLOUD_API_KEY
Value: [Your Google Cloud API key]
```

### Step 3: Deploy
1. Scroll down and click **"DEPLOY"**
2. Wait 2-3 minutes for deployment to complete

## 🔍 What Each Variable Does

### MongoDB Variables:
- **`MONGODB_URI`**: Connection string to your MongoDB Atlas cluster
- **`DB_NAME`**: Database name (your code expects "NYC_Crashes")
- **`COLL_NAME`**: Collection name (your code expects "NYC_Crash_Data")

### API Keys:
- **`OPENAI_API_KEY`**: For AI-powered safety analysis and embeddings
- **`GOOGLE_CLOUD_API_KEY`**: For geocoding addresses and getting route directions

## 🚀 Quick Setup Links

### Get MongoDB Atlas (Free):
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create free cluster
3. Get connection string
4. Replace username/password in the URI

### Get OpenAI API Key:
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account and add payment method
3. Generate API key (starts with `sk-`)

### Get Google Cloud API Key:
1. In your Google Cloud Console
2. Go to "APIs & Services" > "Credentials"
3. Create API Key
4. Enable Geocoding API and Directions API

## ✅ Test Your Setup

After setting the environment variables, test the health endpoint:

```bash
curl https://your-app-url.a.run.app/api/health
```

**Expected Response (All Green):**
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

## 🎯 Current Status Check

Your code checks for these exact conditions:

```javascript
// MongoDB status
const mongoStatus = db ? 'connected' : 'disconnected';

// OpenAI status  
const openaiStatus = process.env.OPENAI_API_KEY ? 'configured' : 'not configured';

// Google Cloud status
const googleStatus = process.env.GOOGLE_CLOUD_API_KEY ? 'configured' : 'not configured';
```

So you need:
1. ✅ Valid MongoDB connection → Green dot
2. ✅ OpenAI API key set → Green dot  
3. ✅ Google Cloud API key set → Green dot

Once all 3 environment variables are properly set, your red dots will turn green! 🎉