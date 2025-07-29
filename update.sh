#!/bin/bash
echo "🚀 Updating from Git..."
cd /var/www/apimanager-new
git stash
git pull origin master
cd backend && npm install
cd ../frontend && npm install && cd frontend && ./build-with-assets.sh
cd ../backend && npx prisma generate && npx prisma migrate deploy
pm2 restart apimanager-backend
sudo systemctl reload nginx
echo "✅ Update completed!"
