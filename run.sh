#!/bin/bash

# API Manager Run Script
echo "🚀 Starting API Manager..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start services
print_status "Starting services with Docker Compose..."
docker-compose up -d

# Wait a moment for services to start
sleep 5

# Check service status
print_status "Checking service status..."
docker-compose ps

print_success "🎉 API Manager is starting up!"

echo ""
echo "📋 Access Information:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/api-docs"
echo ""
echo "👤 Default Users:"
echo "   Admin: admin@apimanager.com / admin123"
echo "   Demo: demo@apimanager.com / demo123"
echo ""
echo "📊 Monitor logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
echo ""
print_success "Services are starting up! Please wait a moment for all services to be ready." 