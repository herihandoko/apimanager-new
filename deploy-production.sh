#!/bin/bash

# API Manager Production Deployment Script
set -e

echo "🚀 Starting API Manager Production Deployment..."

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
    print_error "Please don't run as root. Use a regular user with sudo privileges."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp env.production.example .env
    print_warning "Please update .env file with your production values before continuing."
    print_warning "Run: nano .env"
    exit 1
fi

# Load environment variables
source .env

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p backend/logs
mkdir -p backend/uploads

# Generate SSL certificate for development (replace with real certs in production)
if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
    print_status "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=ID/ST=Jakarta/L=Jakarta/O=API Manager/OU=IT/CN=localhost"
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Build images locally
print_status "Building images locally..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
print_status "Starting services with locally built images..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check PostgreSQL
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U apimanager > /dev/null 2>&1; then
    print_status "✅ PostgreSQL is healthy"
else
    print_error "❌ PostgreSQL is not healthy"
    exit 1
fi

# Check Redis
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_status "✅ Redis is healthy"
else
    print_error "❌ Redis is not healthy"
    exit 1
fi

# Check Backend
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    print_status "✅ Backend API is healthy"
else
    print_error "❌ Backend API is not healthy"
    exit 1
fi

# Check Frontend
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Frontend is healthy"
else
    print_error "❌ Frontend is not healthy"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

# Seed database if needed
if [ "$SEED_DATABASE" = "true" ]; then
    print_status "Seeding database..."
    docker-compose -f docker-compose.prod.yml exec -T backend node scripts/seed.js
fi

print_status "🎉 Production deployment completed successfully!"

echo ""
echo "📋 Service URLs:"
echo "   Frontend: https://$(hostname -f)"
echo "   Backend API: https://$(hostname -f)/api"
echo "   API Documentation: https://$(hostname -f)/api-docs"
echo "   Health Check: https://$(hostname -f)/health"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "   Update services: ./deploy-production.sh"
echo ""
echo "🐳 Local Images:"
echo "   Backend: apimanager-backend:latest"
echo "   Frontend: apimanager-frontend:latest"
echo ""
echo "⚠️  PRODUCTION CHECKLIST:"
echo "   ✅ Update SSL certificates with Certbot"
echo "   ✅ Change default passwords in .env file"
echo "   ✅ Configure proper domain names"
echo "   ✅ Set up monitoring and backups"
echo "   ✅ Configure firewall rules"
echo "   ✅ Set up log rotation"
