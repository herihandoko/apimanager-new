#!/bin/bash

echo "🚀 Syncing data from production to localhost..."

# Create local uploads directory if it doesn't exist
mkdir -p backend/uploads

# Download logo from production
echo "📥 Downloading logo from production..."
curl -o backend/uploads/logo-banten.png https://api.bantenprov.go.id/static/logo-banten.png

# Check if logo was downloaded successfully
if [ -f "backend/uploads/logo-banten.png" ]; then
    echo "✅ Logo downloaded successfully!"
    ls -la backend/uploads/logo-banten.png
else
    echo "❌ Failed to download logo"
fi

# Test local logo
echo "🧪 Testing local logo..."
curl -I http://localhost:8000/static/logo-banten.png

echo "🎉 Sync completed!"
