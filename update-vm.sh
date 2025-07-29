#!/bin/bash

# API Manager VM Update Script (Direct Installation)
# This script updates the application from Git on VM without Docker

set -e

echo "🚀 Starting API Manager VM Update..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_status "Running as root - OK"
else
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Backup current version
BACKUP_DIR="/var/www/apimanager-new/backups/$(date +%Y%m%d-%H%M%S)"
print_status "Creating backup in $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r /var/www/apimanager-new/backend "$BACKUP_DIR/"
cp -r /var/www/apimanager-new/frontend "$BACKUP_DIR/"

# Stash current changes
print_status "Stashing current changes..."
cd /var/www/apimanager-new
git stash

# Pull latest changes
print_status "Pulling latest changes from Git..."
git pull origin master

# Install backend dependencies
print_status "Installing backend dependencies..."
cd /var/www/apimanager-new/backend
npm install

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd /var/www/apimanager-new/frontend
npm install

# Run database migrations
print_status "Running database migrations..."
cd /var/www/apimanager-new/backend
npx prisma generate
npx prisma migrate deploy

# Build frontend with assets
print_status "Building frontend with assets..."
cd /var/www/apimanager-new/frontend
npm run build
cp -r public/* dist/

# Restart services
print_status "Restarting services..."
pm2 restart apimanager-backend
sudo systemctl reload nginx

# Test API
print_status "Testing API..."
sleep 5
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    print_status "✅ API is working"
else
    print_error "❌ API test failed"
    exit 1
fi

print_status "🎉 Update completed successfully!"
echo "📁 Backup saved in: $BACKUP_DIR"
echo "🔗 Frontend: https://apimanager.bantenprov.go.id"
echo "🔗 API: https://api.bantenprov.go.id"
