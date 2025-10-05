#!/bin/bash

echo "🚀 Deploying logo to production server..."

# Create uploads directory if it doesn't exist
ssh diskominfosp@10.255.100.221 "mkdir -p /var/www/apimanager-new/backend/uploads"

# Copy logo to production
scp backend/uploads/logo-banten.png diskominfosp@10.255.100.221:/var/www/apimanager-new/backend/uploads/

echo "✅ Logo deployed successfully!"

# Test logo
echo "🧪 Testing logo..."
curl -I https://api.bantenprov.go.id/static/logo-banten.png

echo "🎉 Logo deployment completed!"
