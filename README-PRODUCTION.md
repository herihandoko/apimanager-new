# API Manager - Production Deployment Guide

## 🚀 Overview

This guide provides step-by-step instructions for deploying the API Manager application in a production environment using Docker and Docker Compose.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM
- At least 20GB disk space
- Domain name (for SSL certificates)
- Basic knowledge of Linux/Unix commands

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Frontend      │    │   Backend API   │
│   (Port 80/443) │    │   (React)       │    │   (Express.js)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   PostgreSQL    │    │     Redis       │
                    │   (Database)    │    │   (Cache)       │
                    └─────────────────┘    └─────────────────┘
```

## 🔧 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/herihandoko/apimanager-new.git
cd apimanager-new
```

### 2. Setup Environment
```bash
# Copy environment template
cp env.production.example .env

# Edit environment variables
nano .env
```

### 3. Deploy to Production
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## ⚙️ Configuration

### Environment Variables

Edit `.env` file with your production values:

```bash
# Database Configuration
POSTGRES_PASSWORD=your-super-secure-password
DATABASE_URL=postgresql://apimanager:your-password@postgres:5432/apimanager

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# API Configuration
API_BASE_URL=https://your-domain.com
VITE_API_BASE_URL=https://your-domain.com
```

### SSL Certificates

For production, replace the self-signed certificates:

```bash
# Place your SSL certificates in nginx/ssl/
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

## 🐳 Docker Services

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| nginx | 80, 443 | Reverse proxy with SSL |
| frontend | 80 | React application |
| backend | 8000 | Express.js API |
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Redis cache |

### Service Details

#### Nginx (Reverse Proxy)
- Handles SSL termination
- Rate limiting
- Security headers
- Load balancing
- Static file serving

#### Frontend (React)
- Built with Vite
- Served by Nginx
- Optimized for production
- Client-side routing

#### Backend (Express.js)
- RESTful API
- JWT authentication
- Database operations
- File uploads
- Rate limiting

#### PostgreSQL
- Primary database
- Persistent storage
- Automated backups
- Connection pooling

#### Redis
- Session storage
- Caching
- Rate limiting
- Real-time features

## 📊 Monitoring

### Health Checks

All services include health checks:

```bash
# Check service health
curl https://your-domain.com/health

# Check API health
curl https://your-domain.com/api/health

# Check database
docker-compose -f docker-compose.prod.yml exec postgres pg_isready
```

### Monitoring Script

Use the monitoring script to check system status:

```bash
# Run monitoring
./scripts/monitor.sh

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔒 Security

### Security Headers

Nginx includes security headers:
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy
- Content-Security-Policy
- Strict-Transport-Security

### Rate Limiting

- API endpoints: 10 requests/second
- Authentication: 5 requests/minute
- File uploads: 1 request/second

### SSL/TLS

- TLS 1.2 and 1.3
- Strong cipher suites
- HSTS enabled
- Certificate validation

## 📈 Performance

### Optimization Features

- Gzip compression
- Static file caching
- Database connection pooling
- Redis caching
- CDN-ready static assets
- Optimized Docker images

### Resource Requirements

| Component | CPU | Memory | Disk |
|-----------|-----|--------|------|
| Nginx | 0.5 cores | 128MB | 100MB |
| Frontend | 0.5 cores | 256MB | 500MB |
| Backend | 1 core | 512MB | 1GB |
| PostgreSQL | 1 core | 1GB | 10GB |
| Redis | 0.5 cores | 256MB | 1GB |

## 🔄 Maintenance

### Backup

```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U apimanager apimanager > backup.sql

# Volume backup
docker run --rm -v apimanager_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

### Updates

```bash
# Pull latest changes
git pull origin master

# Rebuild and restart
./deploy.sh
```

### Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Export logs
docker-compose -f docker-compose.prod.yml logs > logs.txt
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :80
lsof -i :443

# Stop conflicting services
sudo systemctl stop nginx
```

#### 2. Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Reset database
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

#### 3. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Regenerate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=ID/ST=Jakarta/L=Jakarta/O=API Manager/OU=IT/CN=your-domain.com"
```

#### 4. Memory Issues
```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.prod.yml
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment
export LOG_LEVEL=debug

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

## 📞 Support

### Useful Commands

```bash
# Service management
docker-compose -f docker-compose.prod.yml up -d          # Start services
docker-compose -f docker-compose.prod.yml down           # Stop services
docker-compose -f docker-compose.prod.yml restart        # Restart services
docker-compose -f docker-compose.prod.yml logs -f        # View logs

# Database operations
docker-compose -f docker-compose.prod.yml exec postgres psql -U apimanager -d apimanager
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Monitoring
./scripts/monitor.sh                                     # System monitoring
docker stats                                             # Container stats
docker system df                                         # Disk usage
```

### Log Locations

- Application logs: `backend/logs/`
- Nginx logs: `nginx/logs/`
- Docker logs: `docker-compose -f docker-compose.prod.yml logs`

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**⚠️ Important Notes:**

- Always backup your data before updates
- Test in staging environment first
- Monitor system resources regularly
- Keep SSL certificates up to date
- Regularly update dependencies
- Document any custom configurations 