#!/bin/bash

echo "🚀 Syncing data from production to localhost..."

# Create necessary directories
mkdir -p backend/uploads
mkdir -p frontend/public/images

# Download logo from production
echo "📥 Downloading logo from production..."
curl -o backend/uploads/logo-banten.png https://api.bantenprov.go.id/static/logo-banten.png

# Copy logo to frontend public directory
echo "📁 Copying logo to frontend..."
cp backend/uploads/logo-banten.png frontend/public/images/logo-banten.png

# Check if files exist
echo "📋 Checking downloaded files..."
ls -la backend/uploads/logo-banten.png
ls -la frontend/public/images/logo-banten.png

# Test local endpoints
echo "🧪 Testing local endpoints..."
echo "Backend logo:"
curl -I http://localhost:8000/static/logo-banten.png

echo "Frontend logo:"
curl -I http://localhost:3000/images/logo-banten.png

echo "Landing page:"
curl -s http://localhost:8000/ | grep -o 'logo-banten.png'

echo "🎉 Sync completed successfully!"
echo "📋 Available URLs:"
echo "   Backend: http://localhost:8000/"
echo "   Frontend: http://localhost:3000/"
echo "   Logo: http://localhost:8000/static/logo-banten.png"
