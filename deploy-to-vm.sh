#!/bin/bash

# Deploy Fix to VM Production
# This script will copy the fix script to VM and run it

echo "🚀 Deploying fix to VM production..."

# VM Configuration
VM_IP="10.255.100.221"
VM_USER="diskominfosp"
VM_PASS="#@!B15miLL4h%#!"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    print_error "sshpass is not installed. Please install it first:"
    echo "  macOS: brew install sshpass"
    echo "  Ubuntu: sudo apt-get install sshpass"
    exit 1
fi

# Copy fix script to VM
print_status "Copying fix script to VM..."
sshpass -p "$VM_PASS" scp -o StrictHostKeyChecking=no fix-production-vm.sh $VM_USER@$VM_IP:/tmp/

# Make script executable on VM
print_status "Making script executable..."
sshpass -p "$VM_PASS" ssh -o StrictHostKeyChecking=no $VM_USER@$VM_IP "chmod +x /tmp/fix-production-vm.sh"

# Run the fix script on VM
print_status "Running fix script on VM..."
sshpass -p "$VM_PASS" ssh -o StrictHostKeyChecking=no $VM_USER@$VM_IP "sudo /tmp/fix-production-vm.sh"

# Check if deployment was successful
print_status "Checking deployment status..."
sshpass -p "$VM_PASS" ssh -o StrictHostKeyChecking=no $VM_USER@$VM_IP "cd /opt/apimanager && docker-compose -f docker-compose.prod.yml ps"

print_status "🎉 Deployment completed!"
echo ""
echo "📋 Check these URLs:"
echo "   Frontend: https://apimanager.bantenprov.go.id"
echo "   Backend API: https://api.bantenprov.go.id"
echo "   Health Check: https://api.bantenprov.go.id/health"
echo ""
echo "🔧 To view logs on VM:"
echo "   ssh $VM_USER@$VM_IP"
echo "   cd /opt/apimanager"
echo "   docker-compose -f docker-compose.prod.yml logs -f" 