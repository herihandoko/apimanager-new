#!/bin/bash

echo "🚀 Setting up local database..."

# Database configuration
DB_NAME="db_apimanager"
DB_USER="apimanager"
DB_PASS="Nd45mulh0!"

echo "📋 Database Configuration:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASS"
echo ""

# Check if MySQL is running
echo "🔍 Checking MySQL status..."
if command -v mysql &> /dev/null; then
    echo "✅ MySQL is installed"
else
    echo "❌ MySQL is not installed"
    echo "Please install MySQL first:"
    echo "  brew install mysql"
    echo "  brew services start mysql"
    exit 1
fi

# Check if MySQL service is running
if brew services list | grep mysql | grep started > /dev/null; then
    echo "✅ MySQL service is running"
else
    echo "🔄 Starting MySQL service..."
    brew services start mysql
fi

# Create database and user
echo "🗄️ Creating database and user..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
mysql -u root -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -u root -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

echo "✅ Database and user created successfully!"

# Test connection
echo "🧪 Testing database connection..."
mysql -h localhost -u $DB_USER -p$DB_PASS -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "Please check your MySQL configuration"
fi

echo "🎉 Local database setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Run database migrations: cd backend && npx prisma migrate dev"
echo "2. Seed database: cd backend && npx prisma db seed"
echo "3. Sync production data: ./sync-database.sh"
