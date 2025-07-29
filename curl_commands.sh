#!/bin/bash

# API Manager - Curl Commands Collection
# Base URL
BASE_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 API Manager - Curl Commands Collection${NC}"
echo "=================================================="
echo ""

# Function to print section headers
print_section() {
    echo -e "${YELLOW}$1${NC}"
    echo "----------------------------------------"
}

# Function to print command
print_command() {
    echo -e "${GREEN}$1${NC}"
    echo ""
}

# 1. Authentication
print_section "🔐 AUTHENTICATION"

print_command "Login (Get JWT Token):"
echo "curl -X POST \"$BASE_URL/api/auth/login\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\": \"admin@apimanager.com\", \"password\": \"admin123\"}'"
echo ""

print_command "Register New User:"
echo "curl -X POST \"$BASE_URL/api/auth/register\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"name\": \"Test User\", \"email\": \"test@example.com\", \"password\": \"password123\", \"roleId\": \"1\"}'"
echo ""

print_command "Refresh Token:"
echo "curl -X POST \"$BASE_URL/api/auth/refresh\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"refreshToken\": \"YOUR_REFRESH_TOKEN\"}'"
echo ""

print_command "Logout:"
echo "curl -X POST \"$BASE_URL/api/auth/logout\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"refreshToken\": \"YOUR_REFRESH_TOKEN\"}'"
echo ""

# 2. API Keys
print_section "🔑 API KEYS"

print_command "Get All API Keys:"
echo "curl -X GET \"$BASE_URL/api/apikeys\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

print_command "Create New API Key:"
echo "curl -X POST \"$BASE_URL/api/apikeys\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"name\": \"My API Key\","
echo "    \"description\": \"API Key for testing\","
echo "    \"permissions\": [\"read\", \"write\"],"
echo "    \"expiresAt\": \"2024-12-31T23:59:59.000Z\","
echo "    \"ipWhitelist\": [\"192.168.1.1\"]"
echo "  }'"
echo ""

print_command "Get API Key by ID:"
echo "curl -X GET \"$BASE_URL/api/apikeys/API_KEY_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

print_command "Update API Key:"
echo "curl -X PUT \"$BASE_URL/api/apikeys/API_KEY_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"name\": \"Updated API Key\","
echo "    \"description\": \"Updated description\","
echo "    \"isActive\": true"
echo "  }'"
echo ""

print_command "Delete API Key:"
echo "curl -X DELETE \"$BASE_URL/api/apikeys/API_KEY_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

# 3. External APIs
print_section "🌐 EXTERNAL APIS"

print_command "Get All External APIs:"
echo "curl -X GET \"$BASE_URL/api/external-apis\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

print_command "Create External API:"
echo "curl -X POST \"$BASE_URL/api/external-apis\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"name\": \"Weather API\","
echo "    \"description\": \"Weather service API\","
echo "    \"baseUrl\": \"https://api.weatherapi.com\","
echo "    \"endpoint\": \"/v1/current.json\","
echo "    \"method\": \"GET\","
echo "    \"requiresAuth\": true,"
echo "    \"authType\": \"api_key\","
echo "    \"authConfig\": {"
echo "      \"headerName\": \"X-API-Key\","
echo "      \"headerValue\": \"your_weather_api_key\""
echo "    },"
echo "    \"rateLimit\": 100,"
echo "    \"timeout\": 5000,"
echo "    \"isActive\": true"
echo "  }'"
echo ""

print_command "Test External API:"
echo "curl -X POST \"$BASE_URL/api/external-apis/EXTERNAL_API_ID/test\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"params\": {"
echo "      \"q\": \"London\","
echo "      \"aqi\": \"no\""
echo "    },"
echo "    \"body\": {}"
echo "  }'"
echo ""

print_command "Update External API:"
echo "curl -X PUT \"$BASE_URL/api/external-apis/EXTERNAL_API_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"name\": \"Updated Weather API\","
echo "    \"description\": \"Updated weather service\","
echo "    \"isActive\": true"
echo "  }'"
echo ""

print_command "Delete External API:"
echo "curl -X DELETE \"$BASE_URL/api/external-apis/EXTERNAL_API_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

# 4. Proxy APIs (Using API Key)
print_section "🚀 PROXY APIS (Menggunakan API Key)"

print_command "Get Todo by ID:"
echo "curl -X GET \"$BASE_URL/api/proxy/jsonplaceholder/todos/1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get All Todos with Pagination:"
echo "curl -X GET \"$BASE_URL/api/proxy/jsonplaceholder/todos?_limit=10&_start=0\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get Post by ID:"
echo "curl -X GET \"$BASE_URL/api/proxy/jsonplaceholder/posts/1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get All Posts with Limit:"
echo "curl -X GET \"$BASE_URL/api/proxy/jsonplaceholder/posts?_limit=5\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

# 5. Users Management
print_section "👥 USERS MANAGEMENT"

print_command "Get All Users:"
echo "curl -X GET \"$BASE_URL/api/users\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

print_command "Create User:"
echo "curl -X POST \"$BASE_URL/api/users\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"name\": \"John Doe\","
echo "    \"email\": \"john@example.com\","
echo "    \"password\": \"password123\","
echo "    \"roleId\": \"1\""
echo "  }'"
echo ""

print_command "Get User by ID:"
echo "curl -X GET \"$BASE_URL/api/users/USER_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

print_command "Update User:"
echo "curl -X PUT \"$BASE_URL/api/users/USER_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"name\": \"Updated Name\","
echo "    \"email\": \"updated@example.com\","
echo "    \"roleId\": \"2\""
echo "  }'"
echo ""

print_command "Delete User:"
echo "curl -X DELETE \"$BASE_URL/api/users/USER_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

# 6. Dashboard
print_section "📊 DASHBOARD"

print_command "Get Dashboard Stats:"
echo "curl -X GET \"$BASE_URL/api/dashboard/stats\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

print_command "Get Recent Activity:"
echo "curl -X GET \"$BASE_URL/api/dashboard/activity\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

print_command "Get API Usage Chart:"
echo "curl -X GET \"$BASE_URL/api/dashboard/usage-chart?period=7d\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

# 7. Audit Logs
print_section "📝 AUDIT LOGS"

print_command "Get All Audit Logs:"
echo "curl -X GET \"$BASE_URL/api/audit?page=1&limit=20\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

print_command "Get Audit Log by ID:"
echo "curl -X GET \"$BASE_URL/api/audit/AUDIT_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

print_command "Search Audit Logs:"
echo "curl -X GET \"$BASE_URL/api/audit/search?q=login&startDate=2024-01-01&endDate=2024-12-31\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

# 8. System Settings
print_section "⚙️ SYSTEM SETTINGS"

print_command "Get System Settings:"
echo "curl -X GET \"$BASE_URL/api/system/settings\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

print_command "Update System Settings:"
echo "curl -X PUT \"$BASE_URL/api/system/settings\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"maintenanceMode\": false,"
echo "    \"rateLimit\": 1000,"
echo "    \"sessionTimeout\": 3600"
echo "  }'"
echo ""

print_command "Get System Health:"
echo "curl -X GET \"$BASE_URL/api/system/health\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

# 9. Health Check
print_section "🏥 HEALTH CHECK"

print_command "Health Check:"
echo "curl -X GET \"$BASE_URL/health\""
echo ""

print_command "API Documentation:"
echo "curl -X GET \"$BASE_URL/api-docs\""
echo ""

echo -e "${GREEN}✅ Semua curl commands telah dibuat!${NC}"
echo ""
echo -e "${BLUE}📋 Cara Penggunaan:${NC}"
echo "1. Ganti YOUR_JWT_TOKEN dengan token yang didapat dari login"
echo "2. Ganti YOUR_API_KEY dengan API key yang sudah dibuat"
echo "3. Ganti ID placeholder (USER_ID, API_KEY_ID, dll) dengan ID yang sebenarnya"
echo ""
echo -e "${YELLOW}🔗 Akses Aplikasi:${NC}"
echo "Frontend: $FRONTEND_URL"
echo "Backend API: $BASE_URL"
echo "API Documentation: $BASE_URL/api-docs"
echo ""
echo -e "${GREEN}Happy Testing! 🚀${NC}" 