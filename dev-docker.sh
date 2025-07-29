#!/bin/bash

# API Manager Development with Docker Databases
echo "🚀 Starting API Manager development environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start database services
print_status "Starting database services with Docker..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for databases to be ready
print_status "Waiting for databases to be ready..."
sleep 15

# Install backend dependencies
if [ ! -d "backend/node_modules" ]; then
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    print_status "Creating backend environment file..."
    cp backend/env.example backend/.env
fi

if [ ! -f "frontend/.env" ]; then
    print_status "Creating frontend environment file..."
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=API Manager
EOF
fi

# Setup database
print_status "Setting up database..."
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..

print_success "🎉 Development environment is ready!"

echo ""
echo "📋 Next Steps:"
echo "   1. Start backend: cd backend && npm run dev"
echo "   2. Start frontend: cd frontend && npm run dev"
echo ""
echo "📋 Access Information:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/api-docs"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "👤 Default Users:"
echo "   Admin: admin@apimanager.com / admin123"
echo "   Demo: demo@apimanager.com / demo123"
echo ""
echo "🔧 Useful Commands:"
echo "   Stop databases: docker-compose -f docker-compose.dev.yml down"
echo "   View database logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   Reset databases: docker-compose -f docker-compose.dev.yml down -v && docker-compose -f docker-compose.dev.yml up -d"
echo ""
print_success "Ready for development! 🚀" 