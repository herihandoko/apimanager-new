#!/bin/bash

# API Manager - Dynamic Proxy Curl Commands
# Base URL
BASE_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 API Manager - Dynamic Proxy Curl Commands${NC}"
echo "======================================================"
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
echo "    \"name\": \"Dynamic Proxy Test Key\","
echo "    \"description\": \"API Key for testing dynamic proxy\","
echo "    \"permissions\": [\"read\", \"write\"]"
echo "  }'"
echo ""

# 2. Dynamic Proxy Examples
print_section "🚀 DYNAMIC PROXY EXAMPLES"

print_command "Get Todo by ID (Dynamic):"
echo "curl -X GET \"$BASE_URL/api/proxy/dynamic/cmdn2u9nr0000g9uxzucq6ebo?id=1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get Post by ID (Dynamic):"
echo "curl -X GET \"$BASE_URL/api/proxy/dynamic/cmdn2u9nw0001g9ux1uku1hap?id=1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get User by ID (Dynamic):"
echo "curl -X GET \"$BASE_URL/api/proxy/dynamic/cmdn2u9ny0002g9uxby78mj7l?id=1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get All Comments (Dynamic):"
echo "curl -X GET \"$BASE_URL/api/proxy/dynamic/cmdn2u9o00003g9uxhfymioq6\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get All Photos (Dynamic):"
echo "curl -X GET \"$BASE_URL/api/proxy/dynamic/cmdn2u9o60005g9uxkf1w5fyx\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get Album by ID (Dynamic):"
echo "curl -X GET \"$BASE_URL/api/proxy/dynamic/cmdn2u9o40004g9ux8ezaet3y?id=1\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

# 3. POST Examples
print_section "📝 POST EXAMPLES (Dynamic Proxy)"

print_command "Create New Post (Dynamic):"
echo "curl -X POST \"$BASE_URL/api/proxy/dynamic/cmdn2u9o70006g9uxl7o40ojn\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"title\": \"My New Post\","
echo "    \"body\": \"This is the content of my new post\","
echo "    \"userId\": 1"
echo "  }'"
echo ""

# 4. PUT Examples
print_section "✏️ PUT EXAMPLES (Dynamic Proxy)"

print_command "Update Post (Dynamic):"
echo "curl -X PUT \"$BASE_URL/api/proxy/dynamic/cmdn2u9o90007g9uxvte8n55c\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"id\": 1,"
echo "    \"title\": \"Updated Post Title\","
echo "    \"body\": \"Updated post content\","
echo "    \"userId\": 1"
echo "  }'"
echo ""

# 5. PATCH Examples
print_section "🔧 PATCH EXAMPLES (Dynamic Proxy)"

print_command "Patch Post (Dynamic):"
echo "curl -X PATCH \"$BASE_URL/api/proxy/dynamic/cmdn2u9od0009g9uxhnzrvgmp\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"id\": 1,"
echo "    \"title\": \"Partially Updated Title\""
echo "  }'"
echo ""

# 6. DELETE Examples
print_section "🗑️ DELETE EXAMPLES (Dynamic Proxy)"

print_command "Delete Post (Dynamic):"
echo "curl -X DELETE \"$BASE_URL/api/proxy/dynamic/cmdn2u9ob0008g9uxprgzli1y\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"id\": 1"
echo "  }'"
echo ""

# 7. External API Management
print_section "🌐 EXTERNAL API MANAGEMENT"

print_command "Get All External APIs:"
echo "curl -X GET \"$BASE_URL/api/external-apis\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""

print_command "Create New External API:"
echo "curl -X POST \"$BASE_URL/api/external-apis\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"name\": \"Custom API\","
echo "    \"description\": \"My custom external API\","
echo "    \"baseUrl\": \"https://api.example.com\","
echo "    \"endpoint\": \"/data/{id}\","
echo "    \"method\": \"GET\","
echo "    \"requiresAuth\": false,"
echo "    \"authType\": \"none\","
echo "    \"rateLimit\": 1000,"
echo "    \"timeout\": 10000,"
echo "    \"isActive\": true"
echo "  }'"
echo ""

print_command "Test External API:"
echo "curl -X POST \"$BASE_URL/api/external-apis/EXTERNAL_API_ID/test\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"params\": {"
echo "      \"id\": \"1\""
echo "    },"
echo "    \"body\": {}"
echo "  }'"
echo ""

# 8. Available API IDs
print_section "📋 AVAILABLE API IDs"

echo "Available Dynamic Proxy Endpoints:"
echo "  GET  /api/proxy/dynamic/cmdn2u9nr0000g9uxzucq6ebo - JSONPlaceholder Todos"
echo "  GET  /api/proxy/dynamic/cmdn2u9nw0001g9ux1uku1hap - JSONPlaceholder Posts"
echo "  GET  /api/proxy/dynamic/cmdn2u9ny0002g9uxby78mj7l - JSONPlaceholder Users"
echo "  GET  /api/proxy/dynamic/cmdn2u9o00003g9uxhfymioq6 - JSONPlaceholder Comments"
echo "  GET  /api/proxy/dynamic/cmdn2u9o40004g9ux8ezaet3y - JSONPlaceholder Albums"
echo "  GET  /api/proxy/dynamic/cmdn2u9o60005g9uxkf1w5fyx - JSONPlaceholder Photos"
echo "  POST /api/proxy/dynamic/cmdn2u9o70006g9uxl7o40ojn - JSONPlaceholder Create Post"
echo "  PUT  /api/proxy/dynamic/cmdn2u9o90007g9uxvte8n55c - JSONPlaceholder Update Post"
echo "  DELETE /api/proxy/dynamic/cmdn2u9ob0008g9uxprgzli1y - JSONPlaceholder Delete Post"
echo "  PATCH /api/proxy/dynamic/cmdn2u9od0009g9uxhnzrvgmp - JSONPlaceholder Patch Post"
echo ""

# 9. Comparison with Old System
print_section "🔄 COMPARISON: OLD vs NEW"

echo -e "${BLUE}OLD SYSTEM (Hardcoded):${NC}"
echo "  GET /api/proxy/jsonplaceholder/todos/1"
echo "  GET /api/proxy/jsonplaceholder/posts/1"
echo "  GET /api/proxy/jsonplaceholder/todos"
echo ""
echo -e "${GREEN}NEW SYSTEM (Dynamic):${NC}"
echo "  GET /api/proxy/dynamic/API_ID?id=1"
echo "  POST /api/proxy/dynamic/API_ID"
echo "  PUT /api/proxy/dynamic/API_ID"
echo "  DELETE /api/proxy/dynamic/API_ID"
echo ""

echo -e "${GREEN}✅ Dynamic Proxy System Ready!${NC}"
echo ""
echo -e "${BLUE}📋 Cara Penggunaan:${NC}"
echo "1. Login untuk mendapatkan JWT Token"
echo "2. Buat API Key untuk testing"
echo "3. Gunakan API ID dari daftar di atas"
echo "4. Ganti YOUR_API_KEY dengan API key yang sudah dibuat"
echo ""
echo -e "${YELLOW}🔗 Akses Aplikasi:${NC}"
echo "Frontend: $FRONTEND_URL"
echo "Backend API: $BASE_URL"
echo "API Documentation: $BASE_URL/api-docs"
echo ""
echo -e "${GREEN}Happy Testing! 🚀${NC}" 