#!/bin/bash

# API Manager Setup Script
echo "🚀 Setting up API Manager..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    print_status "Creating backend environment file..."
    cp backend/env.example backend/.env
    print_success "Backend environment file created"
fi

if [ ! -f "frontend/.env" ]; then
    print_status "Creating frontend environment file..."
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=API Manager
EOF
    print_success "Frontend environment file created"
fi

# Build and start containers
print_status "Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_success "All services are running!"
else
    print_error "Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose exec backend npx prisma migrate deploy

# Seed the database
print_status "Seeding the database..."
docker-compose exec backend npx prisma db seed

print_success "🎉 API Manager setup completed successfully!"

echo ""
echo "📋 Access Information:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/api-docs"
echo "   Health Check: http://localhost:8000/health"
echo ""
echo "👤 Default Users:"
echo "   Admin: admin@apimanager.com / admin123"
echo "   Demo: demo@apimanager.com / demo123"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Update services: docker-compose pull && docker-compose up -d"
echo ""
print_success "Happy coding! 🚀" 