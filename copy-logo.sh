#!/bin/bash

echo "🚀 Copying logo to production server..."

# Copy logo to production server
sshpass -p 'your_password' scp backend/uploads/logo-banten.png diskominfosp@10.255.100.221:/var/www/apimanager-new/backend/uploads/

echo "✅ Logo copied successfully!"

# Test logo on production
echo "🧪 Testing logo on production..."
curl -I https://api.bantenprov.go.id/static/logo-banten.png

echo "🎉 Logo deployment completed!"
