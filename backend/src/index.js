const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const apiKeyRoutes = require('./routes/apiKeys');
const auditRoutes = require('./routes/audit');
const dashboardRoutes = require('./routes/dashboard');
const systemRoutes = require('./routes/system');
const settingsRoutes = require('./routes/settings');
const proxyRoutes = require('./routes/proxy');
const externalAPIRoutes = require('./routes/externalAPIs');
const apiProviderRoutes = require('./routes/apiProviders');
const databaseConnectionRoutes = require('./routes/databaseConnections');
const dynamicQueryRoutes = require('./routes/dynamicQueries');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const prisma = new PrismaClient();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Manager API',
      version: '1.0.0',
      description: 'A comprehensive API management platform',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.apimanager.com' 
          : 'http://localhost:8000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 500, // 1000 for dev, 500 for prod
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks, static files, and auth endpoints
    const skipPaths = ['/health', '/static/', '/api/auth/'];
    return skipPaths.some(path => req.path.startsWith(path));
  },
});

// Speed limiting - disabled for development
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: process.env.NODE_ENV === 'development' ? 500 : 200, // 500 for dev, 200 for prod
  delayMs: () => process.env.NODE_ENV === 'development' ? 100 : 200, // 100ms for dev, 200ms for prod
  skip: (req) => {
    // Skip speed limiting for health checks, static files, and auth endpoints
    const skipPaths = ['/health', '/static/', '/api/auth/'];
    return skipPaths.some(path => req.path.startsWith(path));
  },
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
// Parse CORS origins
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? corsOrigins : "https://apimanager.bantenprov.go.id",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all routes except auth
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }
  return limiter(req, res, next);
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }
  return speedLimiter(req, res, next);
});

// Static files serving
app.use('/static', express.static('uploads'));

// Landing page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Manager - Pemerintah Provinsi Banten</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                overflow-x: hidden;
            }
            .container {
                text-align: center;
                max-width: 700px;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                backdrop-filter: blur(15px);
                box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.2);
                position: relative;
                overflow: hidden;
                margin: 0.5rem;
            }
            .container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            }
            .logo-img {
                max-width: 80px;
                height: auto;
                margin-bottom: 1rem;
                filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
                animation: float 3s ease-in-out infinite;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            h1 {
                font-size: 2rem;
                margin-bottom: 0.5rem;
                text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.4);
                background: linear-gradient(45deg, #fff, #e3f2fd);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 700;
            }
            .subtitle {
                font-size: 1rem;
                margin-bottom: 1rem;
                opacity: 0.95;
                font-weight: 300;
                letter-spacing: 1px;
            }
            .description {
                font-size: 0.9rem;
                line-height: 1.5;
                margin-bottom: 1.5rem;
                opacity: 0.9;
                max-width: 450px;
                margin-left: auto;
                margin-right: auto;
            }
            .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                gap: 0.6rem;
                margin-bottom: 1.5rem;
            }
            .feature {
                background: rgba(255, 255, 255, 0.1);
                padding: 0.6rem;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: transform 0.3s ease;
            }
            .feature:hover {
                transform: translateY(-5px);
                background: rgba(255, 255, 255, 0.15);
            }
            .feature-icon {
                font-size: 2rem;
                margin-bottom: 1rem;
            }
            .feature-title {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
            }
            .feature-desc {
                font-size: 0.9rem;
                opacity: 0.8;
            }
            .links {
                display: flex;
                gap: 0.8rem;
                justify-content: center;
                flex-wrap: wrap;
                margin-bottom: 1rem;
            }
            .link-btn {
                display: inline-block;
                padding: 10px 20px;
                background: linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
                color: white;
                text-decoration: none;
                border-radius: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                transition: all 0.3s ease;
                font-weight: 600;
                font-size: 0.8rem;
                position: relative;
                overflow: hidden;
            }
            .link-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s;
            }
            .link-btn:hover::before {
                left: 100%;
            }
            .link-btn:hover {
                background: linear-gradient(45deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
                border-color: rgba(255, 255, 255, 0.5);
                transform: translateY(-3px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            }
            .footer {
                margin-top: 2rem;
                font-size: 0.9rem;
                opacity: 0.8;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                padding-top: 1.5rem;
            }
            .stats {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin: 1rem 0;
                flex-wrap: wrap;
            }
            .stat {
                text-align: center;
            }
            .stat-number {
                font-size: 1.2rem;
                font-weight: 700;
                color: #4ecdc4;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }
            .stat-label {
                font-size: 0.7rem;
                opacity: 0.8;
            }
            @media (max-width: 768px) {
                .container {
                    margin: 0.5rem;
                    padding: 1.5rem;
                }
                h1 {
                    font-size: 2.2rem;
                }
                .links {
                    flex-direction: column;
                    align-items: center;
                }
                .features {
                    grid-template-columns: 1fr;
                    gap: 0.8rem;
                }
                .feature {
                    padding: 0.8rem;
                }
                .stats {
                    gap: 1rem;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <img src="/static/logo-banten.png" alt="Logo Banten" class="logo-img">
            <h1>API Manager</h1>
            <p class="subtitle">Pemerintah Provinsi Banten</p>
            <p class="description">
                Platform manajemen API terintegrasi untuk mendukung digitalisasi 
                layanan publik di Provinsi Banten. Kelola, monitor, dan amankan 
                API dengan mudah dan efisien.
            </p>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">100+</div>
                    <div class="stat-label">API Terkelola</div>
                </div>
                <div class="stat">
                    <div class="stat-number">99.9%</div>
                    <div class="stat-label">Uptime</div>
                </div>
                <div class="stat">
                    <div class="stat-number">24/7</div>
                    <div class="stat-label">Monitoring</div>
                </div>
            </div>

            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🔐</div>
                    <div class="feature-title">Keamanan Tinggi</div>
                    <div class="feature-desc">Enkripsi end-to-end dan autentikasi multi-layer</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <div class="feature-title">Analytics Real-time</div>
                    <div class="feature-desc">Monitoring performa dan usage analytics</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">⚡</div>
                    <div class="feature-title">High Performance</div>
                    <div class="feature-desc">Response time optimal dan skalabilitas tinggi</div>
                </div>
            </div>

            <div class="links">
                <a href="/api-docs" class="link-btn">📚 API Documentation</a>
                <a href="/health" class="link-btn">🏥 Health Check</a>
                <a href="https://apimanager.bantenprov.go.id" class="link-btn">🌐 Dashboard</a>
            </div>
            
            <div class="footer">
                <p>&copy; 2025 Pemerintah Provinsi Banten. All rights reserved.</p>
                <p style="margin-top: 0.5rem; font-size: 0.8rem;">Membangun Banten Digital yang Berkelanjutan</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/roles', authenticateToken, roleRoutes);
app.use('/api/apikeys', authenticateToken, apiKeyRoutes);
app.use('/api/audit', authenticateToken, auditRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/system', authenticateToken, systemRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/external-apis', externalAPIRoutes);
app.use('/api/api-providers', apiProviderRoutes);
app.use('/api/database-connections', authenticateToken, databaseConnectionRoutes);
app.use('/api/dynamic-queries', authenticateToken, dynamicQueryRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Database connection test
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 8000;

async function startServer() {
  await testDatabaseConnection();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}); 