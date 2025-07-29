#!/bin/bash

# Simple Fix Script for VM Production
# Run this on the VM without sudo

echo "🔧 Fixing Production Deployment Issues..."

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

# Check if we're on the VM
if [ ! -d "/opt/apimanager" ]; then
    print_error "This script should be run on the VM at /opt/apimanager"
    exit 1
fi

cd /opt/apimanager

# 1. Fix environment variables
print_status "Fixing environment variables..."

# Create proper .env file for production
cat > .env << 'EOF'
# Production Environment Variables
POSTGRES_PASSWORD=apimanager_prod_password_2024
DATABASE_URL=postgresql://apimanager_user:apimanager_prod_password_2024@postgres:5432/apimanager
REDIS_URL=redis://redis:6379
JWT_SECRET=apimanager-super-secret-jwt-key-2024-production-minimum-32-characters
CORS_ORIGIN=https://apimanager.bantenprov.go.id,https://api.bantenprov.go.id
API_BASE_URL=https://api.bantenprov.go.id
PORT=8000
VITE_API_BASE_URL=https://api.bantenprov.go.id
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads
BCRYPT_ROUNDS=12
SESSION_SECRET=apimanager-super-secret-session-key-2024
ENABLE_METRICS=true
METRICS_PORT=9090
EOF

print_status "✅ Environment variables updated"

# 2. Create necessary directories
print_status "Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p backend/logs
mkdir -p backend/uploads

# 3. Generate SSL certificate if not exists
if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
    print_status "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=ID/ST=Banten/L=Serang/O=Banten Province/OU=IT/CN=apimanager.bantenprov.go.id"
fi

# 4. Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# 5. Build and start services
print_status "Building and starting services..."
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# 6. Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# 7. Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

# 8. Check service health
print_status "Checking service health..."

# Check PostgreSQL
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U apimanager_user > /dev/null 2>&1; then
    print_status "✅ PostgreSQL is healthy"
else
    print_error "❌ PostgreSQL is not healthy"
fi

# Check Redis
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_status "✅ Redis is healthy"
else
    print_error "❌ Redis is not healthy"
fi

# Check Backend
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    print_status "✅ Backend API is healthy"
else
    print_error "❌ Backend API is not healthy"
fi

print_status "🎉 Production deployment fixed!"

echo ""
echo "📋 Service URLs:"
echo "   Frontend: https://apimanager.bantenprov.go.id"
echo "   Backend API: https://api.bantenprov.go.id"
echo "   Health Check: http://localhost:8000/health"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart services: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Update DNS records to point to this server"
echo "   - Replace self-signed SSL with proper certificates"
echo "   - Configure firewall rules"
echo "   - Set up monitoring and backups" 