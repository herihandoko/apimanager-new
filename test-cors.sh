#!/bin/bash

echo "🧪 Testing CORS configuration..."

echo "1. Testing OPTIONS request:"
curl -s -I -H "Origin: https://apimanager.bantenprov.go.id" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS https://api.bantenprov.go.id/api/auth/login | grep -i "access-control"

echo -e "\n2. Testing actual login request:"
curl -s -X POST https://api.bantenprov.go.id/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://apimanager.bantenprov.go.id" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  | head -1

echo -e "\n✅ CORS test completed!"
