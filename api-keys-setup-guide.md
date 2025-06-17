# SafeStep API Keys Setup Guide 🔑

Your SafeStep app is deployed! Now let's connect the APIs to unlock full functionality.

## 🍃 1. MongoDB Atlas Setup

### Get Your MongoDB Connection String:
1. **Go to [MongoDB Atlas](https://cloud.mongodb.com)**
2. **Sign up/Login** with your account
3. **Create a Free Cluster** (M0 Sandbox - Free forever)
4. **Set up Database Access:**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `safestep-user`
   - Generate a secure password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

5. **Set up Network Access:**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

6. **Get Connection String:**
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like):
   ```
   mongodb+srv://safestep-user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Add `/safestep` before the `?` to specify database name:
   ```
   mongodb+srv://safestep-user:yourpassword@cluster0.xxxxx.mongodb.net/safestep?retryWrites=true&w=majority
   ```

## 🤖 2. OpenAI API Key Setup

### Get Your OpenAI API Key:
1. **Go to [OpenAI Platform](https://platform.openai.com)**
2. **Sign up/Login** with your account
3. **Add Payment Method** (required for API access)
   - Go to "Billing" in left sidebar
   - Add a payment method
   - Set usage limits (recommended: $10-20/month for testing)
4. **Create API Key:**
   - Go to "API Keys" in left sidebar
   - Click "Create new secret key"
   - Name it "SafeStep-Production"
   - Copy the key (starts with `sk-`)
   - **Save it immediately** - you won't see it again!

### Expected Format:
```
sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## ☁️ 3. Google Cloud API Key Setup

### Enable Required APIs:
1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **Select your project** (gleaming-bus-453713-d3)
3. **Enable APIs:**
   - Go to "APIs & Services" > "Library"
   - Search and enable:
     - **Geocoding API**
     - **Directions API**
     - **Maps JavaScript API** (optional, for future features)

### Create API Key:
1. **Go to "APIs & Services" > "Credentials"**
2. **Click "Create Credentials" > "API Key"**
3. **Copy the API key**
4. **Restrict the key (recommended):**
   - Click on the key to edit
   - Under "API restrictions", select "Restrict key"
   - Choose: Geocoding API, Directions API
   - Save

### Expected Format:
```
AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🚀 4. Update Cloud Run Environment Variables

### Method 1: Google Cloud Console (Recommended)
1. **Go to [Cloud Run Console](https://console.cloud.google.com/run)**
2. **Click on your `safesteps` service**
3. **Click "Edit & Deploy New Revision"**
4. **Go to "Variables & Secrets" tab**
5. **Add/Update these environment variables:**

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://safestep-user:yourpassword@cluster0.xxxxx.mongodb.net/safestep?retryWrites=true&w=majority
DB_NAME=safestep
COLL_NAME=crashes

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Cloud
GOOGLE_CLOUD_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server Config (already set)
NODE_ENV=production
PORT=8080
```

6. **Click "Deploy"**

### Method 2: Command Line (Alternative)
```bash
# Set your project
gcloud config set project gleaming-bus-453713-d3

# Update environment variables
gcloud run services update safesteps \
  --region=northamerica-northeast2 \
  --set-env-vars="MONGODB_URI=mongodb+srv://safestep-user:yourpassword@cluster0.xxxxx.mongodb.net/safestep?retryWrites=true&w=majority,DB_NAME=safestep,COLL_NAME=crashes,OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx,GOOGLE_CLOUD_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## 📊 5. Set Up Sample Data (Optional)

### Create Sample Crash Data:
1. **In MongoDB Atlas:**
   - Go to "Database" > "Browse Collections"
   - Create database: `safestep`
   - Create collection: `crashes`
   - Insert sample document:

```json
{
  "crash_date": "2024-01-15",
  "crash_time": "14:30",
  "borough": "MANHATTAN",
  "on_street_name": "BROADWAY",
  "cross_street_name": "42ND STREET",
  "latitude": 40.7580,
  "longitude": -73.9855,
  "number_of_persons_injured": 1,
  "number_of_persons_killed": 0,
  "vehicle_type_code1": "SEDAN",
  "contributing_factor_vehicle_1": "DRIVER INATTENTION/DISTRACTION",
  "location": {
    "type": "Point",
    "coordinates": [-73.9855, 40.7580]
  }
}
```

## ✅ 6. Test Your Setup

### Check Health Endpoint:
```bash
curl https://safesteps-[your-hash].a.run.app/api/health
```

### Expected Response:
```json
{
  "status": "healthy",
  "services": {
    "mongodb": "connected",
    "openai": "configured",
    "googleCloud": "configured"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test Route Planning:
1. **Visit your app URL**
2. **Click "Plan Route"**
3. **Enter addresses:**
   - From: "Times Square, New York"
   - To: "Brooklyn Bridge, New York"
4. **Click "Find Safe Routes"**
5. **You should see real routes with AI analysis!**

## 💰 7. Cost Management

### MongoDB Atlas:
- **Free Tier**: 512MB storage, shared cluster
- **Cost**: $0/month (perfect for testing)

### OpenAI API:
- **Pay-per-use**: ~$0.0001 per 1K tokens
- **Estimated cost**: $5-20/month for moderate usage
- **Set billing limits** in OpenAI dashboard

### Google Cloud APIs:
- **Geocoding**: $5 per 1,000 requests (first 40K free/month)
- **Directions**: $5 per 1,000 requests (first 40K free/month)
- **Estimated cost**: $0-10/month for testing

## 🔧 8. Troubleshooting

### If MongoDB connection fails:
- Check IP whitelist (should be 0.0.0.0/0)
- Verify username/password
- Ensure database name is correct

### If OpenAI fails:
- Check API key format (starts with sk-)
- Verify billing is set up
- Check usage limits

### If Google APIs fail:
- Ensure APIs are enabled
- Check API key restrictions
- Verify project billing is enabled

## 🎉 Success Indicators

When everything is working, you'll see:
- ✅ Real-time route computation
- ✅ AI-powered safety analysis
- ✅ Interactive crash data visualization
- ✅ Intelligent recommendations

Your SafeStep app will transform from demo mode to a fully functional AI-powered navigation system!

## 🆘 Need Help?

If you encounter issues:
1. Check the Cloud Run logs in Google Cloud Console
2. Test each API key individually
3. Verify all environment variables are set correctly
4. Ensure billing is enabled for all services

---

**Ready to make your routes safer with AI! 🛡️🗺️**