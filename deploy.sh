#!/bin/bash

# Simple deploy script for push-pull workflow
echo "🚀 Deploying changes from Git..."

# Pull latest changes
git pull origin master

# Run update script
./update-vm.sh

echo "✅ Deployment completed!"
