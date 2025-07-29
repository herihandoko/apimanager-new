#!/bin/bash

# API Manager - API Provider Curl Commands
# Base URL
BASE_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 API Manager - API Provider System Curl Commands${NC}"
echo "=========================================================="
echo ""
echo -e "${YELLOW}💡 KEUNTUNGAN API PROVIDER SYSTEM:${NC}"
echo "✅ Satu provider = Banyak endpoint"
echo "✅ Tidak perlu daftar per endpoint"
echo "✅ Lebih efisien dan mudah manage"
echo "✅ Support semua HTTP methods"
echo "✅ Authentication per provider"
echo "✅ Rate limiting per provider"
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

print_command "Create API Key:"
echo "curl -X POST \"$BASE_URL/api/apikeys\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"name\": \"API Provider Test Key\","
echo "    \"description\": \"API Key for testing API Provider system\","
echo "    \"permissions\": [\"read\", \"write\"]"
echo "  }'"
echo ""

# 2. API Provider Examples
print_section "🚀 API PROVIDER EXAMPLES"

print_command "Get Todo by ID (JSONPlaceholder Provider):"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/todos/1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get All Todos (JSONPlaceholder Provider):"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/todos?_limit=5\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get Post by ID (JSONPlaceholder Provider):"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/posts/1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get All Posts (JSONPlaceholder Provider):"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/posts?_limit=3\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get User by ID (JSONPlaceholder Provider):"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/users/1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get All Users (JSONPlaceholder Provider):"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/users\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get All Comments (JSONPlaceholder Provider):"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/comments?_limit=5\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get Comment by ID (JSONPlaceholder Provider):"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/comments/1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get Album by ID (JSONPlaceholder Provider):"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/albums/1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get All Albums (JSONPlaceholder Provider):"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/albums?_limit=3\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get All Photos (JSONPlaceholder Provider):"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/photos?_limit=5\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get Photo by ID (JSONPlaceholder Provider):"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/photos/1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

# 3. POST Examples
print_section "📝 POST EXAMPLES (API Provider)"

print_command "Create New Post (JSONPlaceholder Provider):"
echo "curl -X POST \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/posts\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"title\": \"My New Post via API Provider\","
echo "    \"body\": \"This is the content of my new post using API Provider system\","
echo "    \"userId\": 1"
echo "  }'"
echo ""

# 4. PUT Examples
print_section "✏️ PUT EXAMPLES (API Provider)"

print_command "Update Post (JSONPlaceholder Provider):"
echo "curl -X PUT \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/posts/1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"id\": 1,"
echo "    \"title\": \"Updated Post Title via API Provider\","
echo "    \"body\": \"Updated post content using API Provider system\","
echo "    \"userId\": 1"
echo "  }'"
echo ""

# 5. PATCH Examples
print_section "🔧 PATCH EXAMPLES (API Provider)"

print_command "Patch Post (JSONPlaceholder Provider):"
echo "curl -X PATCH \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/posts/1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"id\": 1,"
echo "    \"title\": \"Partially Updated Title via API Provider\""
echo "  }'"
echo ""

# 6. DELETE Examples
print_section "🗑️ DELETE EXAMPLES (API Provider)"

print_command "Delete Post (JSONPlaceholder Provider):"
echo "curl -X DELETE \"$BASE_URL/api/proxy/provider/cmdn31fxg0000cenoohlxq5a7/posts/1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"id\": 1"
echo "  }'"
echo ""

# 7. Available Providers
print_section "📋 AVAILABLE API PROVIDERS"

echo "🔗 JSONPlaceholder Provider (ID: cmdn31fxg0000cenoohlxq5a7):"
echo "   Base URL: https://jsonplaceholder.typicode.com"
echo "   Status: ✅ Active"
echo "   Endpoints (16):"
echo "     GET  /todos/{id} - Get todo by ID"
echo "     GET  /todos - Get all todos"
echo "     GET  /posts/{id} - Get post by ID"
echo "     GET  /posts - Get all posts"
echo "     POST /posts - Create new post"
echo "     PUT  /posts/{id} - Update post"
echo "     PATCH /posts/{id} - Patch post"
echo "     DELETE /posts/{id} - Delete post"
echo "     GET  /users/{id} - Get user by ID"
echo "     GET  /users - Get all users"
echo "     GET  /comments - Get all comments"
echo "     GET  /comments/{id} - Get comment by ID"
echo "     GET  /albums/{id} - Get album by ID"
echo "     GET  /albums - Get all albums"
echo "     GET  /photos - Get all photos"
echo "     GET  /photos/{id} - Get photo by ID"
echo ""

echo "🔗 OpenWeatherMap Provider (ID: cmdn31fyy000xcenouqe8dhgc):"
echo "   Base URL: https://api.openweathermap.org/data/2.5"
echo "   Status: ❌ Inactive (needs API key)"
echo "   Endpoints (2):"
echo "     GET /weather - Get current weather data"
echo "     GET /forecast - Get weather forecast"
echo ""

# 8. Comparison
print_section "🔄 COMPARISON: OLD vs NEW vs API PROVIDER"

echo -e "${BLUE}OLD SYSTEM (Hardcoded):${NC}"
echo "  GET /api/proxy/jsonplaceholder/todos/1"
echo "  GET /api/proxy/jsonplaceholder/posts/1"
echo "  GET /api/proxy/jsonplaceholder/todos"
echo ""

echo -e "${GREEN}NEW SYSTEM (Dynamic per endpoint):${NC}"
echo "  GET /api/proxy/dynamic/API_ID?id=1"
echo "  POST /api/proxy/dynamic/API_ID"
echo "  PUT /api/proxy/dynamic/API_ID"
echo "  DELETE /api/proxy/dynamic/API_ID"
echo ""

echo -e "${YELLOW}API PROVIDER SYSTEM (Most Efficient):${NC}"
echo "  GET /api/proxy/provider/PROVIDER_ID/todos/1"
echo "  GET /api/proxy/provider/PROVIDER_ID/posts/1"
echo "  POST /api/proxy/provider/PROVIDER_ID/posts"
echo "  PUT /api/proxy/provider/PROVIDER_ID/posts/1"
echo "  DELETE /api/proxy/provider/PROVIDER_ID/posts/1"
echo ""

# 9. Benefits
print_section "✅ KEUNTUNGAN API PROVIDER SYSTEM"

echo "🎯 EFFICIENCY:"
echo "  • Satu provider = 16+ endpoints"
echo "  • Tidak perlu daftar per endpoint"
echo "  • Setup sekali, pakai banyak"
echo ""

echo "🔧 MANAGEMENT:"
echo "  • Authentication per provider"
echo "  • Rate limiting per provider"
echo "  • Timeout per provider"
echo "  • Status active/inactive per provider"
echo ""

echo "📊 MONITORING:"
echo "  • Log usage per provider"
echo "  • Response time tracking"
echo "  • Error handling per provider"
echo "  • Success rate monitoring"
echo ""

echo "🛡️ SECURITY:"
echo "  • API key authentication"
echo "  • IP whitelisting support"
echo "  • Rate limiting protection"
echo "  • Request/response logging"
echo ""

echo -e "${GREEN}✅ API Provider System Ready!${NC}"
echo ""
echo -e "${BLUE}📋 Cara Penggunaan:${NC}"
echo "1. Login untuk mendapatkan JWT Token"
echo "2. Buat API Key untuk testing"
echo "3. Gunakan Provider ID dari daftar di atas"
echo "4. Ganti YOUR_API_KEY dengan API key yang sudah dibuat"
echo ""
echo -e "${YELLOW}🔗 Akses Aplikasi:${NC}"
echo "Frontend: $FRONTEND_URL"
echo "Backend API: $BASE_URL"
echo "API Documentation: $BASE_URL/api-docs"
echo ""
echo -e "${GREEN}Happy Testing! 🚀${NC}" 