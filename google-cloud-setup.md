# Google Cloud Backend Deployment Guide

## Prerequisites

1. **Google Cloud Account**: Sign up at [cloud.google.com](https://cloud.google.com)
2. **Google Cloud CLI**: Install from [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install)
3. **Project Setup**: Create a new Google Cloud project

## Quick Deployment (5 minutes)

### Option 1: Using the Deploy Script (Recommended)

```bash
# Make the script executable
chmod +x deploy-backend.sh

# Run the deployment script
./deploy-backend.sh
```

The script will:
- Check prerequisites
- Enable required APIs
- Set up App Engine
- Deploy your backend
- Provide the deployed URL

### Option 2: Manual Deployment

1. **Authenticate with Google Cloud:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Enable required APIs:**
   ```bash
   gcloud services enable appengine.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable geocoding-backend.googleapis.com
   gcloud services enable directions-backend.googleapis.com
   ```

3. **Create App Engine app:**
   ```bash
   gcloud app create --region=us-central
   ```

4. **Update environment variables in `app.yaml`:**
   ```yaml
   env_variables:
     MONGODB_URI: "your-mongodb-connection-string"
     OPENAI_API_KEY: "your-openai-api-key"
     GOOGLE_CLOUD_API_KEY: "your-google-cloud-api-key"
   ```

5. **Deploy:**
   ```bash
   gcloud app deploy app.yaml
   ```

## Environment Variables Setup

### Required API Keys:

1. **MongoDB Atlas:**
   - Go to [cloud.mongodb.com](https://cloud.mongodb.com)
   - Create cluster and get connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/safestep`

2. **OpenAI API:**
   - Go to [platform.openai.com](https://platform.openai.com/api-keys)
   - Create API key
   - Format: `sk-...`

3. **Google Cloud API:**
   - Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   - Create API key
   - Enable Geocoding API and Directions API

## Post-Deployment

### 1. Test Your Backend
```bash
# Check health endpoint
curl https://YOUR_APP_URL.appspot.com/api/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "mongodb": "connected",
    "openai": "configured",
    "googleCloud": "configured"
  }
}
```

### 2. Update Frontend
Update your frontend's `.env` file:
```bash
VITE_API_URL=https://YOUR_APP_URL.appspot.com/api
```

### 3. Redeploy Frontend
```bash
npm run build
# Deploy to Netlify/Vercel with new API URL
```

## Monitoring & Management

### View Logs:
```bash
gcloud app logs tail -s default
```

### Open in Browser:
```bash
gcloud app browse
```

### Deploy Updates:
```bash
gcloud app deploy
```

### Scale Resources:
Edit `app.yaml` and redeploy:
```yaml
automatic_scaling:
  min_instances: 1
  max_instances: 20
  target_cpu_utilization: 0.6
```

## Cost Optimization

### App Engine Pricing:
- **Free Tier**: 28 instance hours/day
- **Standard**: ~$0.05/hour per instance
- **Automatic scaling**: Scales to 0 when not in use

### Estimated Monthly Cost:
- **Light usage** (demo/hackathon): $0-10
- **Medium usage** (development): $10-50
- **Production usage**: $50-200+

## Troubleshooting

### Common Issues:

1. **"App Engine app not found"**
   ```bash
   gcloud app create --region=us-central
   ```

2. **"API not enabled"**
   ```bash
   gcloud services enable appengine.googleapis.com
   ```

3. **Environment variables not working**
   - Check `app.yaml` formatting
   - Ensure no quotes around values in YAML

4. **MongoDB connection failed**
   - Verify connection string
   - Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for App Engine)

5. **Google APIs not working**
   - Enable Geocoding API and Directions API
   - Check API key restrictions

### Debug Commands:
```bash
# View app details
gcloud app describe

# View versions
gcloud app versions list

# View services
gcloud app services list

# SSH into instance (for debugging)
gcloud app instances ssh
```

## Security Best Practices

1. **API Key Restrictions:**
   - Restrict Google Cloud API key to specific APIs
   - Set HTTP referrer restrictions

2. **MongoDB Security:**
   - Use strong passwords
   - Enable IP whitelisting
   - Use database users with minimal permissions

3. **App Engine Security:**
   - Use HTTPS only (configured by default)
   - Set up IAM roles properly
   - Monitor access logs

## Alternative Deployment Options

### Cloud Run (Containerized):
```bash
# Build and deploy to Cloud Run
gcloud run deploy safestep-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Compute Engine (VM):
```bash
# Create VM and deploy manually
gcloud compute instances create safestep-vm \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-micro
```

## Success Checklist

- [ ] Google Cloud project created
- [ ] APIs enabled (App Engine, Geocoding, Directions)
- [ ] Environment variables configured
- [ ] Backend deployed successfully
- [ ] Health endpoint returns "healthy"
- [ ] Frontend updated with new API URL
- [ ] End-to-end testing completed

Your SafeStep backend is now running on Google Cloud! 🎉