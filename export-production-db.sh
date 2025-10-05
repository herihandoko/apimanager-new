#!/bin/bash

echo "🚀 Exporting database from production..."

# Create backup directory
mkdir -p backups
BACKUP_FILE="backups/production_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📋 Manual steps to export production database:"
echo ""
echo "1. SSH to production server:"
echo "   ssh diskominfosp@10.255.100.221"
echo ""
echo "2. Export database on production server:"
echo "   mysqldump -u apimanager -p db_apimanager > /tmp/production_backup.sql"
echo ""
echo "3. Copy backup to localhost:"
echo "   scp diskominfosp@10.255.100.221:/tmp/production_backup.sql ./backups/"
echo ""
echo "4. Import to local database:"
echo "   mysql -u apimanager -p db_apimanager < ./backups/production_backup.sql"
echo ""

# Alternative: Direct export (if SSH access is available)
echo "🔄 Alternative: Direct export via SSH..."
echo "This requires SSH access to production server."
echo ""

# Check if we have SSH access
echo "🧪 Testing SSH connection to production..."
ssh -o ConnectTimeout=5 diskominfosp@10.255.100.221 "echo 'SSH connection successful'" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ SSH connection to production successful"
    echo "🔄 Attempting direct database export..."
    
    # Try to export directly
    ssh diskominfosp@10.255.100.221 "mysqldump -u apimanager -p db_apimanager" > $BACKUP_FILE
    
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        echo "✅ Database exported successfully to $BACKUP_FILE"
        echo "📊 Backup file size: $(du -h $BACKUP_FILE | cut -f1)"
        echo ""
        echo "🔄 Now importing to local database..."
        echo "Please run: mysql -u apimanager -p db_apimanager < $BACKUP_FILE"
    else
        echo "❌ Database export failed"
        echo "Please use manual steps above"
    fi
else
    echo "❌ SSH connection to production failed"
    echo "Please use manual steps above"
fi

echo "🎉 Database export instructions provided!"
