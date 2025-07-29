#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 API Manager Status Check${NC}"
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check development environment
echo -e "\n${BLUE}📊 Development Environment:${NC}"

# Check if development databases are running
if docker ps --format "table {{.Names}}" | grep -q "apimanager-postgres-dev"; then
    echo -e "${GREEN}✅ PostgreSQL (dev) is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL (dev) is not running${NC}"
fi

if docker ps --format "table {{.Names}}" | grep -q "apimanager-redis-dev"; then
    echo -e "${GREEN}✅ Redis (dev) is running${NC}"
else
    echo -e "${RED}❌ Redis (dev) is not running${NC}"
fi

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is running (http://localhost:8000)${NC}"
else
    echo -e "${RED}❌ Backend API is not running${NC}"
fi

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running (http://localhost:3000)${NC}"
else
    echo -e "${RED}❌ Frontend is not running${NC}"
fi

# Check production environment
echo -e "\n${BLUE}📊 Production Environment:${NC}"

# Check if production containers are running
if docker ps --format "table {{.Names}}" | grep -q "apimanager-postgres-prod"; then
    echo -e "${GREEN}✅ PostgreSQL (prod) is running${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL (prod) is not running${NC}"
fi

if docker ps --format "table {{.Names}}" | grep -q "apimanager-redis-prod"; then
    echo -e "${GREEN}✅ Redis (prod) is running${NC}"
else
    echo -e "${YELLOW}⚠️  Redis (prod) is not running${NC}"
fi

if docker ps --format "table {{.Names}}" | grep -q "apimanager-backend-prod"; then
    echo -e "${GREEN}✅ Backend (prod) is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend (prod) is not running${NC}"
fi

if docker ps --format "table {{.Names}}" | grep -q "apimanager-frontend-prod"; then
    echo -e "${GREEN}✅ Frontend (prod) is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend (prod) is not running${NC}"
fi

if docker ps --format "table {{.Names}}" | grep -q "apimanager-nginx-prod"; then
    echo -e "${GREEN}✅ Nginx (prod) is running${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx (prod) is not running${NC}"
fi

# Show access information
echo -e "\n${BLUE}🌐 Access Information:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "   API Documentation: ${GREEN}http://localhost:8000/api-docs${NC}"
echo -e "   Health Check: ${GREEN}http://localhost:8000/health${NC}"

# Show default users
echo -e "\n${BLUE}👤 Default Users:${NC}"
echo -e "   Admin: ${GREEN}admin@apimanager.com${NC} / ${GREEN}admin123${NC}"
echo -e "   Demo: ${GREEN}demo@apimanager.com${NC} / ${GREEN}demo123${NC}"

# Show useful commands
echo -e "\n${BLUE}🔧 Useful Commands:${NC}"
echo -e "   Start dev environment: ${YELLOW}./dev-docker.sh${NC}"
echo -e "   Start prod environment: ${YELLOW}./run-docker.sh${NC}"
echo -e "   Stop dev databases: ${YELLOW}docker-compose -f docker-compose.dev.yml down${NC}"
echo -e "   Stop prod services: ${YELLOW}docker-compose -f docker-compose.prod.yml down${NC}"
echo -e "   View logs: ${YELLOW}docker-compose logs -f [service-name]${NC}"

echo -e "\n${GREEN}✅ Status check completed!${NC}" 