#!/bin/bash

# API Manager - RSUD Banten API Provider Curl Commands
# Base URL
BASE_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 API Manager - RSUD Banten SIMRS API Provider${NC}"
echo "======================================================"
echo ""
echo -e "${YELLOW}💡 RSUD BANTEN SIMRS PROVIDER:${NC}"
echo "✅ Provider ID: cmdn3dyeb0000cvpz77dizu2l"
echo "✅ Base URL: https://simrs.bantenprov.go.id"
echo "✅ Authentication: Bearer Token (X-AUTH-TOKEN)"
echo "✅ Endpoints: 3 endpoints dari collection"
echo "✅ Rate Limit: 100/hour"
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
echo "    \"name\": \"RSUD Banten Test Key\","
echo "    \"description\": \"API Key for testing RSUD Banten SIMRS\","
echo "    \"permissions\": [\"read\", \"write\"]"
echo "  }'"
echo ""

# 2. RSUD Banten API Examples
print_section "🏥 RSUD BANTEN SIMRS API EXAMPLES"

print_command "Get Data Tempat Tidur:"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn3dyeb0000cvpz77dizu2l/service/medifirst2000/get-tempat-tidur\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Get Data Pasien per Department:"
echo "curl -X GET \"$BASE_URL/api/proxy/provider/cmdn3dyeb0000cvpz77dizu2l/service/medifirst2000/get-pasien-bydepartemen\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\""
echo ""

print_command "Login SIMRS (POST):"
echo "curl -X POST \"$BASE_URL/api/proxy/provider/cmdn3dyeb0000cvpz77dizu2l/service/medifirst2000/auth/sign-in?namaUser=admin.master&kataSandi=bapau\" \\"
echo "  -H \"X-API-Key: YOUR_API_KEY\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

# 3. Comparison with Original Collection
print_section "🔄 COMPARISON: ORIGINAL vs API MANAGER"

echo -e "${BLUE}ORIGINAL POSTMAN COLLECTION:${NC}"
echo "  GET https://simrs.bantenprov.go.id/service/medifirst2000/get-tempat-tidur"
echo "  GET https://simrs.bantenprov.go.id/service/medifirst2000/get-pasien-bydepartemen"
echo "  POST https://simrs.bantenprov.go.id/service/medifirst2000/auth/sign-in"
echo ""

echo -e "${GREEN}API MANAGER PROVIDER SYSTEM:${NC}"
echo "  GET /api/proxy/provider/cmdn3dyeb0000cvpz77dizu2l/service/medifirst2000/get-tempat-tidur"
echo "  GET /api/proxy/provider/cmdn3dyeb0000cvpz77dizu2l/service/medifirst2000/get-pasien-bydepartemen"
echo "  POST /api/proxy/provider/cmdn3dyeb0000cvpz77dizu2l/service/medifirst2000/auth/sign-in"
echo ""

# 4. Benefits
print_section "✅ KEUNTUNGAN MENGGUNAKAN API MANAGER"

echo "🔐 SECURITY:"
echo "  • API Key authentication"
echo "  • Rate limiting (100/hour)"
echo "  • IP whitelisting support"
echo "  • Request/response logging"
echo ""

echo "📊 MONITORING:"
echo "  • Usage analytics per endpoint"
echo "  • Response time tracking"
echo "  • Error rate monitoring"
echo "  • Success rate tracking"
echo ""

echo "🔧 MANAGEMENT:"
echo "  • Centralized configuration"
echo "  • Easy token management"
echo "  • Provider status control"
echo "  • Endpoint enable/disable"
echo ""

echo "🚀 EFFICIENCY:"
echo "  • Satu provider = 3 endpoints"
echo "  • Tidak perlu manage per endpoint"
echo "  • Authentication otomatis"
echo "  • Consistent error handling"
echo ""

# 5. Provider Details
print_section "📋 RSUD BANTEN PROVIDER DETAILS"

echo "🔗 Provider Information:"
echo "  Name: RSUD Banten SIMRS"
echo "  ID: cmdn3dyeb0000cvpz77dizu2l"
echo "  Base URL: https://simrs.bantenprov.go.id"
echo "  Status: ✅ Active"
echo "  Auth Type: Bearer Token"
echo "  Rate Limit: 100/hour"
echo "  Timeout: 30 seconds"
echo ""

echo "📋 Available Endpoints:"
echo "  1. GET  /service/medifirst2000/get-tempat-tidur"
echo "     Description: Get data tempat tidur RSUD Banten"
echo ""
echo "  2. GET  /service/medifirst2000/get-pasien-bydepartemen"
echo "     Description: Get data pasien per department RSUD Banten"
echo ""
echo "  3. POST /service/medifirst2000/auth/sign-in"
echo "     Description: Login ke SIMRS RSUD Banten"
echo ""

# 6. Usage Instructions
print_section "📋 CARA PENGGUNAAN"

echo "1. 🔐 Login ke API Manager:"
echo "   curl -X POST \"$BASE_URL/api/auth/login\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"email\": \"admin@apimanager.com\", \"password\": \"admin123\"}'"
echo ""

echo "2. 🔑 Buat API Key:"
echo "   curl -X POST \"$BASE_URL/api/apikeys\" \\"
echo "     -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"name\": \"RSUD Banten Key\", \"permissions\": [\"read\"]}'"
echo ""

echo "3. 🏥 Akses RSUD Banten API:"
echo "   # Get Tempat Tidur"
echo "   curl -X GET \"$BASE_URL/api/proxy/provider/cmdn3dyeb0000cvpz77dizu2l/service/medifirst2000/get-tempat-tidur\" \\"
echo "     -H \"X-API-Key: YOUR_API_KEY\""
echo ""
echo "   # Get Pasien per Department"
echo "   curl -X GET \"$BASE_URL/api/proxy/provider/cmdn3dyeb0000cvpz77dizu2l/service/medifirst2000/get-pasien-bydepartemen\" \\"
echo "     -H \"X-API-Key: YOUR_API_KEY\""
echo ""

echo -e "${GREEN}✅ RSUD Banten Provider Ready!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "• Provider ID: cmdn3dyeb0000cvpz77dizu2l"
echo "• Endpoints: 3 endpoints dari collection"
echo "• Authentication: Otomatis via Bearer Token"
echo "• Rate Limit: 100 requests/hour"
echo "• Monitoring: Full logging dan analytics"
echo ""
echo -e "${YELLOW}🔗 Akses Aplikasi:${NC}"
echo "Frontend: $FRONTEND_URL"
echo "Backend API: $BASE_URL"
echo "API Documentation: $BASE_URL/api-docs"
echo ""
echo -e "${GREEN}Happy Testing! 🏥🚀${NC}" 