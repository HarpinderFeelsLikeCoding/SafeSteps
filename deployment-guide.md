# SafeStep Deployment Guide 🚀

## Quick Deployment Options

### Option 1: Netlify (Recommended for Hackathons)
**Best for: Quick demos, frontend-focused presentations**

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop your `dist` folder
   - Or connect your GitHub repo for auto-deployment

3. **Environment Variables in Netlify:**
   - Go to Site Settings → Environment Variables
   - Add your API keys:
     ```
     VITE_API_URL=https://your-backend-url.com/api
     ```

### Option 2: Vercel
**Best for: React applications with serverless functions**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Add environment variables:**
   ```bash
   vercel env add VITE_API_URL
   ```

### Option 3: Google Cloud Run (Full Stack)
**Best for: Complete application with backend**

1. **Build Docker image:**
   ```bash
   docker build -t safestep .
   ```

2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy safestep \
     --image gcr.io/YOUR_PROJECT_ID/safestep \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Option 4: Railway (Easiest Full Stack)
**Best for: Quick full-stack deployment**

1. **Connect GitHub repo to Railway**
2. **Add environment variables**
3. **Deploy automatically**

## Environment Variables Needed

### For Frontend (.env):
```bash
VITE_API_URL=https://your-backend-url.com/api
```

### For Backend (.env):
```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safestep

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Google Cloud
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key

# Server
PORT=8080
NODE_ENV=production
```

## Quick Demo Setup (5 minutes)

### For Hackathon Presentation:

1. **Frontend Only (Netlify):**
   ```bash
   # Build frontend
   npm run build:client
   
   # Deploy dist folder to Netlify
   # Use demo mode with mock data
   ```

2. **Full Stack (Railway):**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Deploy SafeStep"
   git push origin main
   
   # Connect to Railway and deploy
   ```

## Pre-Deployment Checklist

- [ ] All API keys configured
- [ ] MongoDB Atlas accessible
- [ ] Google Cloud APIs enabled
- [ ] OpenAI API key valid
- [ ] Build process works locally
- [ ] Environment variables set

## Troubleshooting

### Common Issues:
1. **CORS errors**: Update server CORS settings
2. **API timeouts**: Check MongoDB connection
3. **Build failures**: Verify all dependencies installed
4. **Environment variables**: Double-check all keys are set

### Quick Fixes:
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Demo URLs
After deployment, your app will be available at:
- Netlify: `https://your-app-name.netlify.app`
- Vercel: `https://your-app-name.vercel.app`
- Railway: `https://your-app-name.up.railway.app`

## Performance Tips
- Enable gzip compression
- Use CDN for static assets
- Optimize images
- Enable caching headers
- Minify CSS/JS (done automatically)

Good luck with your hackathon presentation! 🎉