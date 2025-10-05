# Database Sync Guide - Production to Localhost

## 🚀 **Langkah-langkah Sync Database dari Production ke Localhost**

### **1. Export Database dari Production Server**

```bash
# SSH ke production server
ssh diskominfosp@10.255.100.221

# Masuk ke direktori aplikasi
cd /var/www/apimanager-new

# Export database
mysqldump -u apimanager -p db_apimanager > production_backup.sql

# Copy file backup ke direktori yang bisa diakses
cp production_backup.sql /tmp/production_backup.sql
```

### **2. Download Backup ke Localhost**

```bash
# Dari localhost, download backup
scp diskominfosp@10.255.100.221:/tmp/production_backup.sql ./backups/

# Atau jika ada akses SFTP, download manual
```

### **3. Setup Database Local**

```bash
# Pastikan MySQL berjalan
brew services start mysql

# Buat database dan user (jika belum ada)
mysql -u root -p
```

```sql
-- Di MySQL console
CREATE DATABASE IF NOT EXISTS db_apimanager;
CREATE USER IF NOT EXISTS 'apimanager'@'localhost' IDENTIFIED BY 'Nd45mulh0!';
GRANT ALL PRIVILEGES ON db_apimanager.* TO 'apimanager'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### **4. Import Database ke Local**

```bash
# Import backup ke database local
mysql -u apimanager -p db_apimanager < backups/production_backup.sql
```

### **5. Update Prisma Schema**

```bash
# Masuk ke direktori backend
cd backend

# Generate Prisma client
npx prisma generate

# Reset database (jika perlu)
npx prisma migrate reset

# Atau apply migrations
npx prisma migrate dev
```

### **6. Test Database Connection**

```bash
# Test koneksi database
npx prisma db pull

# Atau test dengan Prisma Studio
npx prisma studio
```

## 📋 **Script yang Tersedia**

- `setup-local-database.sh` - Setup database local
- `export-production-db.sh` - Export database dari production
- `sync-database.sh` - Sync database lengkap

## 🔧 **Troubleshooting**

### **Jika MySQL tidak bisa connect:**
```bash
# Check MySQL status
brew services list | grep mysql

# Restart MySQL
brew services restart mysql

# Check MySQL logs
tail -f /usr/local/var/mysql/*.err
```

### **Jika Prisma error:**
```bash
# Reset Prisma
npx prisma migrate reset

# Generate ulang
npx prisma generate

# Apply migrations
npx prisma migrate dev
```

## 🎯 **Hasil Akhir**

Setelah sync berhasil, Anda akan memiliki:
- ✅ Database local dengan data production
- ✅ User dan roles dari production
- ✅ API keys dan configurations
- ✅ Audit logs dan history

## 📞 **Bantuan**

Jika ada masalah, cek:
1. MySQL service berjalan
2. Database dan user sudah dibuat
3. Prisma schema sudah di-update
4. Backup file tidak corrupt
