# GitHub Commit Instructions

Run these commands in your terminal to commit and push the Cloud Run fixes:

## 1. Check current status
```bash
git status
```

## 2. Add all changes
```bash
git add .
```

## 3. Commit with descriptive message
```bash
git commit -m "Fix Cloud Run deployment issues

- Extended timeout to 300 seconds for container startup
- Added better logging for debugging
- Fixed service name to 'safesteps'
- Added graceful shutdown handlers
- Improved error handling for server startup
- Updated environment variables with actual MongoDB URI"
```

## 4. Push to GitHub
```bash
git push origin main
```

## Alternative: If you're on master branch
```bash
git push origin master
```

## 5. Verify the push
```bash
git log --oneline -5
```

This will automatically trigger a new Cloud Build deployment with all the fixes applied.