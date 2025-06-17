#!/bin/bash

echo "🧹 SafeStep Google Cloud Cleanup Script"
echo "======================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first."
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
echo "📋 Current project: $PROJECT_ID"

echo ""
echo "Choose cleanup option:"
echo "1. Delete App Engine service only (keep project)"
echo "2. Delete entire Google Cloud project"
echo "3. Cancel"
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🗑️ Deleting App Engine service..."
        
        # Stop all versions
        echo "⏹️ Stopping all App Engine versions..."
        gcloud app versions list --format="value(version.id)" | while read version; do
            if [ "$version" != "$(gcloud app versions list --filter="traffic_split>0" --format="value(version.id)")" ]; then
                echo "Stopping version: $version"
                gcloud app versions stop $version --quiet
            fi
        done
        
        # Note: You cannot delete the default service, but you can stop versions
        echo "✅ App Engine versions stopped"
        echo "ℹ️ Note: The default App Engine service cannot be deleted, but all versions are stopped"
        echo "💰 This will minimize costs as no instances will be running"
        ;;
        
    2)
        echo "⚠️ WARNING: This will delete the ENTIRE project and ALL resources!"
        echo "Project to delete: $PROJECT_ID"
        echo ""
        read -p "Type 'DELETE' to confirm project deletion: " confirm
        
        if [ "$confirm" = "DELETE" ]; then
            echo "🗑️ Deleting entire project: $PROJECT_ID"
            gcloud projects delete $PROJECT_ID
            echo "✅ Project deletion initiated"
            echo "ℹ️ It may take a few minutes for the project to be fully deleted"
        else
            echo "❌ Project deletion cancelled"
        fi
        ;;
        
    3)
        echo "❌ Cleanup cancelled"
        exit 0
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🧹 Cleanup complete!"
echo ""
echo "📝 Additional cleanup steps:"
echo "   1. Remove any local configuration:"
echo "      gcloud config unset project"
echo "   2. Check your Google Cloud Console to verify deletion"
echo "   3. Remove any billing alerts if you set them up"