#!/bin/bash
echo "🔄 Rolling back..."
cd /var/www/apimanager-new
git reset --hard HEAD~1
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart apimanager-backend
sudo systemctl reload nginx
echo "✅ Rollback completed!"
