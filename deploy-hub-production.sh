#!/bin/bash

# API Manager Production Deployment Script (Docker Hub with Platform Fix)
set -e

echo "🚀 Starting API Manager Production Deployment from Docker Hub..."

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
docker-compose -f docker-compose.hub.yml down --remove-orphans

# Try to pull images with platform specification
print_status "Pulling latest images from Docker Hub with platform specification..."

# Try different platform combinations
PLATFORMS=("linux/amd64" "linux/x86_64" "linux/arm64" "linux/arm/v7")

for platform in "${PLATFORMS[@]}"; do
    print_status "Trying platform: $platform"
    
    if docker pull --platform $platform herihand2402/apimanager-backend:latest 2>/dev/null; then
        print_status "✅ Successfully pulled backend with platform: $platform"
        BACKEND_PLATFORM=$platform
        break
    else
        print_warning "❌ Failed to pull backend with platform: $platform"
    fi
done

for platform in "${PLATFORMS[@]}"; do
    print_status "Trying platform: $platform"
    
    if docker pull --platform $platform herihand2402/apimanager-frontend:latest 2>/dev/null; then
        print_status "✅ Successfully pulled frontend with platform: $platform"
        FRONTEND_PLATFORM=$platform
        break
    else
        print_warning "❌ Failed to pull frontend with platform: $platform"
    fi
done

# If Docker Hub fails, fallback to local build
if [ -z "$BACKEND_PLATFORM" ] || [ -z "$FRONTEND_PLATFORM" ]; then
    print_warning "Docker Hub images not available for this architecture."
    print_status "Falling back to local build..."
    
    # Create a temporary docker-compose file for local build
    cat > docker-compose.fallback.yml << 'COMPOSE'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: apimanager-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: apimanager
      POSTGRES_USER: apimanager
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-apimanager123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/prisma/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - apimanager-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U apimanager"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: apimanager-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - apimanager-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: apimanager-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 8000
      DATABASE_URL: postgresql://apimanager:${POSTGRES_PASSWORD:-apimanager123}@postgres:5432/apimanager
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:3000,http://localhost:3001}
      API_BASE_URL: ${API_BASE_URL:-http://localhost:8000}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - apimanager-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: apimanager-frontend
    restart: unless-stopped
    environment:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL:-http://localhost:8000}
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - apimanager-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  apimanager-network:
    driver: bridge
COMPOSE

    # Build and start with local images
    print_status "Building images locally..."
    docker-compose -f docker-compose.fallback.yml build --no-cache
    
    print_status "Starting services with locally built images..."
    docker-compose -f docker-compose.fallback.yml up -d
    
    COMPOSE_FILE="docker-compose.fallback.yml"
else
    # Use Docker Hub images with platform specification
    print_status "Starting services from Docker Hub images..."
    docker-compose -f docker-compose.hub.yml up -d
    COMPOSE_FILE="docker-compose.hub.yml"
fi

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check PostgreSQL
if docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U apimanager > /dev/null 2>&1; then
    print_status "✅ PostgreSQL is healthy"
else
    print_error "❌ PostgreSQL is not healthy"
    exit 1
fi

# Check Redis
if docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
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
docker-compose -f $COMPOSE_FILE exec -T backend npx prisma migrate deploy

# Seed database if needed
if [ "$SEED_DATABASE" = "true" ]; then
    print_status "Seeding database..."
    docker-compose -f $COMPOSE_FILE exec -T backend node scripts/seed.js
fi

print_status "🎉 Deployment completed successfully!"

echo ""
echo "📋 Service URLs:"
echo "   Frontend: https://localhost"
echo "   Backend API: https://localhost/api"
echo "   API Documentation: https://localhost/api-docs"
echo "   Health Check: https://localhost/health"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   Stop services: docker-compose -f $COMPOSE_FILE down"
echo "   Restart services: docker-compose -f $COMPOSE_FILE restart"
echo "   Update services: ./deploy-hub-production.sh"
echo ""
echo "🐳 Images Used:"
if [ -z "$BACKEND_PLATFORM" ]; then
    echo "   Backend: Local build"
    echo "   Frontend: Local build"
else
    echo "   Backend: herihand2402/apimanager-backend:latest ($BACKEND_PLATFORM)"
    echo "   Frontend: herihand2402/apimanager-frontend:latest ($FRONTEND_PLATFORM)"
fi
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Update SSL certificates for production"
echo "   - Change default passwords in .env file"
echo "   - Configure proper domain names"
echo "   - Set up monitoring and backups"
