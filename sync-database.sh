#!/bin/bash

echo "🚀 Syncing database from production to localhost..."

# Database configuration
PROD_DB_HOST="10.255.100.221"
PROD_DB_NAME="db_apimanager"
PROD_DB_USER="apimanager"
PROD_DB_PASS="Nd45mulh0!"

LOCAL_DB_HOST="localhost"
LOCAL_DB_NAME="db_apimanager"
LOCAL_DB_USER="apimanager"
LOCAL_DB_PASS="Nd45mulh0!"

# Create backup directory
mkdir -p backups
BACKUP_FILE="backups/production_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📥 Exporting database from production..."

# Export from production (you'll need to run this on production server)
echo "⚠️  You need to run this command on production server:"
echo "mysqldump -h $PROD_DB_HOST -u $PROD_DB_USER -p$PROD_DB_PASS $PROD_DB_NAME > $BACKUP_FILE"
echo ""
echo "Then copy the backup file to localhost and run:"
echo "mysql -h $LOCAL_DB_HOST -u $LOCAL_DB_USER -p$LOCAL_DB_PASS $LOCAL_DB_NAME < $BACKUP_FILE"
echo ""

# Alternative: Direct sync (if SSH access is available)
echo "🔄 Alternative: Direct database sync..."
echo "This requires SSH access to production server."

# Check if we can connect to local database
echo "🧪 Testing local database connection..."
mysql -h $LOCAL_DB_HOST -u $LOCAL_DB_USER -p$LOCAL_DB_PASS -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Local database connection successful"
else
    echo "❌ Local database connection failed"
    echo "Please check your local database configuration"
fi

echo "📋 Manual steps to sync database:"
echo "1. SSH to production server: ssh diskominfosp@10.255.100.221"
echo "2. Export database: mysqldump -u apimanager -p db_apimanager > backup.sql"
echo "3. Copy backup to local: scp backup.sql user@localhost:~/"
echo "4. Import to local: mysql -u apimanager -p db_apimanager < backup.sql"

echo "🎉 Database sync instructions provided!"
