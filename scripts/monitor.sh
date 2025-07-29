#!/bin/bash

# API Manager Production Monitoring Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[MONITOR]${NC} $1"
}

# Check if docker-compose.prod.yml exists
if [ ! -f docker-compose.prod.yml ]; then
    print_error "docker-compose.prod.yml not found. Please run this script from the project root."
    exit 1
fi

# Function to check service health
check_service() {
    local service=$1
    local url=$2
    local description=$3
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        print_status "✅ $description is healthy"
        return 0
    else
        print_error "❌ $description is not responding"
        return 1
    fi
}

# Function to check container status
check_container() {
    local container=$1
    local status=$(docker-compose -f docker-compose.prod.yml ps -q $container)
    
    if [ -n "$status" ]; then
        local container_status=$(docker inspect --format='{{.State.Status}}' $status)
        if [ "$container_status" = "running" ]; then
            print_status "✅ Container $container is running"
            return 0
        else
            print_error "❌ Container $container is not running (status: $container_status)"
            return 1
        fi
    else
        print_error "❌ Container $container not found"
        return 1
    fi
}

# Function to check disk usage
check_disk_usage() {
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -lt 80 ]; then
        print_status "✅ Disk usage: ${usage}%"
    else
        print_warning "⚠️  Disk usage: ${usage}% (high)"
    fi
}

# Function to check memory usage
check_memory_usage() {
    local usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    if (( $(echo "$usage < 80" | bc -l) )); then
        print_status "✅ Memory usage: ${usage}%"
    else
        print_warning "⚠️  Memory usage: ${usage}% (high)"
    fi
}

# Function to check database connections
check_database() {
    local connections=$(docker-compose -f docker-compose.prod.yml exec -T postgres psql -U apimanager -d apimanager -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tail -n 1 | tr -d ' ')
    if [ -n "$connections" ] && [ "$connections" -gt 0 ]; then
        print_status "✅ Database connections: $connections"
    else
        print_error "❌ Database connection check failed"
    fi
}

# Function to check Redis
check_redis() {
    local ping=$(docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping 2>/dev/null)
    if [ "$ping" = "PONG" ]; then
        print_status "✅ Redis is responding"
    else
        print_error "❌ Redis is not responding"
    fi
}

# Function to get container logs
get_logs() {
    local service=$1
    local lines=${2:-10}
    echo ""
    print_header "Recent logs for $service (last $lines lines):"
    docker-compose -f docker-compose.prod.yml logs --tail=$lines $service
}

# Main monitoring function
main() {
    echo ""
    print_header "API Manager Production Monitoring"
    echo "======================================"
    echo ""
    
    # Check system resources
    print_header "System Resources:"
    check_disk_usage
    check_memory_usage
    echo ""
    
    # Check containers
    print_header "Container Status:"
    check_container "postgres"
    check_container "redis"
    check_container "backend"
    check_container "frontend"
    echo ""
    
    # Check services
    print_header "Service Health:"
    check_service "http://localhost:8000/health" "Backend API"
    check_service "http://localhost/health" "Frontend"
    check_service "http://localhost/api-docs" "API Documentation"
    echo ""
    
    # Check databases
    print_header "Database Status:"
    check_database
    check_redis
    echo ""
    
    # Show recent logs if there are issues
    print_header "Recent Logs (if any errors):"
    local has_errors=false
    
    # Check for errors in logs
    if docker-compose -f docker-compose.prod.yml logs --tail=20 | grep -i "error\|exception\|failed" > /dev/null 2>&1; then
        has_errors=true
        print_warning "Found errors in logs. Showing recent logs for all services:"
        get_logs "backend" 5
        get_logs "frontend" 5
        get_logs "postgres" 5
        get_logs "redis" 5
    else
        print_status "No recent errors found in logs"
    fi
    
    echo ""
    print_header "Monitoring Summary:"
    echo "========================"
    
    # Summary
    if [ "$has_errors" = true ]; then
        print_warning "⚠️  Some issues detected. Check logs above for details."
    else
        print_status "✅ All systems appear to be running normally"
    fi
    
    echo ""
    echo "🔧 Quick Commands:"
    echo "   View all logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "   Restart services: docker-compose -f docker-compose.prod.yml restart"
    echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "   Update services: ./deploy.sh"
}

# Run monitoring
main 