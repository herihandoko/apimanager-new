#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting API Manager with Docker...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}[ERROR] Docker Compose is not installed. Please install Docker Compose and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}[INFO] Docker and Docker Compose are available${NC}"

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}[INFO] Creating backend environment file...${NC}"
    cp backend/env.example backend/.env
    echo -e "${GREEN}[SUCCESS] Backend environment file created${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}[INFO] Creating frontend environment file...${NC}"
    cp frontend/env.example frontend/.env
    echo -e "${GREEN}[SUCCESS] Frontend environment file created${NC}"
fi

# Build and start containers
echo -e "${YELLOW}[INFO] Building and starting containers...${NC}"
docker-compose -f docker-compose.prod.yml up --build -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS] Containers started successfully${NC}"
else
    echo -e "${RED}[ERROR] Failed to start containers${NC}"
    exit 1
fi

# Wait for services to be ready
echo -e "${YELLOW}[INFO] Waiting for services to be ready...${NC}"
sleep 10

# Check if services are running
echo -e "${YELLOW}[INFO] Checking service status...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Run database migrations and seed
echo -e "${YELLOW}[INFO] Setting up database...${NC}"
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed

echo -e "${GREEN}[SUCCESS] 🎉 API Manager is running!${NC}"

echo -e "${BLUE}📋 Access Information:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "   API Documentation: ${GREEN}http://localhost:8000/api-docs${NC}"
echo -e "   Health Check: ${GREEN}http://localhost:8000/health${NC}"

echo -e "${BLUE}👤 Default Users:${NC}"
echo -e "   Admin: ${GREEN}admin@apimanager.com${NC} / ${GREEN}admin123${NC}"
echo -e "   Demo: ${GREEN}demo@apimanager.com${NC} / ${GREEN}demo123${NC}"

echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo -e "   View logs: ${YELLOW}docker-compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "   Stop services: ${YELLOW}docker-compose -f docker-compose.prod.yml down${NC}"
echo -e "   Restart services: ${YELLOW}docker-compose -f docker-compose.prod.yml restart${NC}"

echo -e "${GREEN}[SUCCESS] Ready to use! 🚀${NC}" 