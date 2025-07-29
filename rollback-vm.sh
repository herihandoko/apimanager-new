#!/bin/bash

# API Manager VM Rollback Script
# This script rolls back to previous version if update fails

set -e

echo "🔄 Starting API Manager VM Rollback..."

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

# Rollback Git
print_status "Rolling back Git changes..."
cd /var/www/apimanager-new
git reset --hard HEAD~1

# Restore from backup if available
BACKUP_DIR=$(ls -t /var/www/apimanager-new/backups/ | head -1)
if [ -n "$BACKUP_DIR" ]; then
    print_status "Restoring from backup: $BACKUP_DIR"
    cp -r "/var/www/apimanager-new/backups/$BACKUP_DIR/backend" /var/www/apimanager-new/
    cp -r "/var/www/apimanager-new/backups/$BACKUP_DIR/frontend" /var/www/apimanager-new/
fi

# Install dependencies
print_status "Installing dependencies..."
cd /var/www/apimanager-new/backend
npm install

cd /var/www/apimanager-new/frontend
npm install

# Build frontend
print_status "Building frontend..."
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
    print_status "✅ Rollback completed successfully"
else
    print_error "❌ Rollback failed"
    exit 1
fi

print_status "🎉 Rollback completed!"
echo "🔗 Frontend: https://apimanager.bantenprov.go.id"
echo "🔗 API: https://api.bantenprov.go.id"
