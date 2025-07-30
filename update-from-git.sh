#!/bin/bash

# Script untuk update aplikasi dari Git dengan aman
echo "🚀 Starting update from Git..."

# Backup current version
BACKUP_DIR="/var/www/apimanager-new/backups/$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating backup in $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r /var/www/apimanager-new/backend "$BACKUP_DIR/"
cp -r /var/www/apimanager-new/frontend "$BACKUP_DIR/"

# Stash current changes
echo "💾 Stashing current changes..."
cd /var/www/apimanager-new
git stash

# Pull latest changes
echo "⬇️ Pulling latest changes from Git..."
git pull origin master

# Install dependencies
echo "📦 Installing backend dependencies..."
cd /var/www/apimanager-new/backend
npm install

echo "📦 Installing frontend dependencies..."
cd /var/www/apimanager-new/frontend
npm install

# Run database migrations
echo "🗄️ Running database migrations..."
cd /var/www/apimanager-new/backend
npx prisma generate
npx prisma migrate deploy

# Build frontend
echo "🔨 Building frontend..."
cd /var/www/apimanager-new/frontend
npm run build

# Restart services
echo "🔄 Restarting services..."
pm2 restart apimanager-backend
sudo systemctl reload nginx

# Test API
echo "🧪 Testing API..."
sleep 5
curl -f http://localhost:8000/health > /dev/null && echo "✅ API is working" || echo "❌ API test failed"

echo "🎉 Update completed successfully!"
echo "📁 Backup saved in: $BACKUP_DIR"
echo "🔗 Frontend: https://apimanager.bantenprov.go.id"
echo "🔗 API: https://api.bantenprov.go.id"
