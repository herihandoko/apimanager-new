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
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 1000 for dev, 100 for prod
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.path === '/health' || req.path.startsWith('/static/');
  },
});

// Speed limiting - disabled for development
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: process.env.NODE_ENV === 'development' ? 500 : 50, // 500 for dev, 50 for prod
  delayMs: () => process.env.NODE_ENV === 'development' ? 100 : 500, // 100ms for dev, 500ms for prod
  skip: (req) => {
    // Skip speed limiting for health checks and static files
    return req.path === '/health' || req.path.startsWith('/static/');
  },
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all routes
app.use(limiter);
app.use(speedLimiter);

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