#!/bin/bash

# API Manager Development Script
echo "🚀 Starting API Manager in development mode..."

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

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version 18 or higher is recommended. Current version: $(node -v)"
fi

# Check if PostgreSQL is running (for local development)
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    print_warning "PostgreSQL is not running on localhost:5432"
    print_status "Starting PostgreSQL with Docker..."
    docker run -d --name postgres-dev \
        -e POSTGRES_DB=apimanager \
        -e POSTGRES_USER=apimanager_user \
        -e POSTGRES_PASSWORD=apimanager_password \
        -p 5432:5432 \
        postgres:15-alpine
    
    print_status "Waiting for PostgreSQL to be ready..."
    sleep 10
fi

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    print_warning "Redis is not running on localhost:6379"
    print_status "Starting Redis with Docker..."
    docker run -d --name redis-dev \
        -p 6379:6379 \
        redis:7-alpine
    
    print_status "Waiting for Redis to be ready..."
    sleep 5
fi

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
echo ""
echo "👤 Default Users:"
echo "   Admin: admin@apimanager.com / admin123"
echo "   Demo: demo@apimanager.com / demo123"
echo ""
print_success "Ready for development! 🚀" 