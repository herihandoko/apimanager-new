const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkPermission } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/system/config:
 *   get:
 *     summary: Get system configuration
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System configuration retrieved successfully
 */
router.get('/config', checkPermission('system:read'), asyncHandler(async (req, res) => {
  const configs = await prisma.systemConfig.findMany({
    orderBy: { key: 'asc' }
  });

  const configObject = {};
  configs.forEach(config => {
    configObject[config.key] = config.value;
  });

  res.json({
    success: true,
    data: configObject
  });
}));

/**
 * @swagger
 * /api/system/config/{key}:
 *   get:
 *     summary: Get specific system configuration
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: System configuration retrieved successfully
 */
router.get('/config/:key', checkPermission('system:read'), asyncHandler(async (req, res) => {
  const { key } = req.params;

  const config = await prisma.systemConfig.findUnique({
    where: { key }
  });

  if (!config) {
    return res.status(404).json({
      success: false,
      message: 'Configuration not found'
    });
  }

  res.json({
    success: true,
    data: {
      key: config.key,
      value: config.value,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }
  });
}));

/**
 * @swagger
 * /api/system/config/{key}:
 *   put:
 *     summary: Update system configuration
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: object
 *     responses:
 *       200:
 *         description: System configuration updated successfully
 */
router.put('/config/:key', [
  checkPermission('system:update'),
  body('value').notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { key } = req.params;
  const { value } = req.body;

  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'SystemConfig',
      resourceId: config.id,
      details: { key, value },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    message: 'System configuration updated successfully',
    data: {
      key: config.key,
      value: config.value,
      updatedAt: config.updatedAt
    }
  });
}));

/**
 * @swagger
 * /api/system/health:
 *   get:
 *     summary: Get system health status
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health status retrieved successfully
 */
router.get('/health', checkPermission('system:read'), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Test database connection
  let dbStatus = 'healthy';
  let dbResponseTime = 0;
  
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbResponseTime = Date.now() - dbStart;
  } catch (error) {
    dbStatus = 'unhealthy';
    console.error('Database health check failed:', error);
  }

  // Get system statistics
  const [
    totalUsers,
    totalApiKeys,
    totalAuditLogs,
    totalApiLogs
  ] = await Promise.all([
    prisma.user.count(),
    prisma.apiKey.count(),
    prisma.auditLog.count(),
    prisma.apiLog.count()
  ]);

  const overallResponseTime = Date.now() - startTime;

  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: overallResponseTime,
      services: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime
        }
      },
      statistics: {
        totalUsers,
        totalApiKeys,
        totalAuditLogs,
        totalApiLogs
      }
    }
  });
}));

/**
 * @swagger
 * /api/system/stats:
 *   get:
 *     summary: Get system statistics
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 */
router.get('/stats', checkPermission('system:read'), asyncHandler(async (req, res) => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    totalApiKeys,
    activeApiKeys,
    totalRequests24h,
    totalRequests7d,
    totalRequests30d,
    newUsers24h,
    newUsers7d,
    newUsers30d,
    newApiKeys24h,
    newApiKeys7d,
    newApiKeys30d,
    topUsers,
    topApiKeys
  ] = await Promise.all([
    // Total users
    prisma.user.count(),
    
    // Active users
    prisma.user.count({ where: { isActive: true } }),
    
    // Total API keys
    prisma.apiKey.count(),
    
    // Active API keys
    prisma.apiKey.count({ where: { isActive: true } }),
    
    // Total requests in different periods
    prisma.apiLog.count({ where: { createdAt: { gte: last24Hours } } }),
    prisma.apiLog.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.apiLog.count({ where: { createdAt: { gte: last30Days } } }),
    
    // New users in different periods
    prisma.user.count({ where: { createdAt: { gte: last24Hours } } }),
    prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
    
    // New API keys in different periods
    prisma.apiKey.count({ where: { createdAt: { gte: last24Hours } } }),
    prisma.apiKey.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.apiKey.count({ where: { createdAt: { gte: last30Days } } }),
    
    // Top users by API key count
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        _count: {
          select: { apiKeys: true }
        }
      },
      orderBy: { apiKeys: { _count: 'desc' } },
      take: 10
    }),
    
    // Top API keys by usage
    prisma.apiLog.groupBy({
      by: ['apiKeyId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    })
  ]);

  // Get top API keys details
  const topApiKeysDetails = await Promise.all(
    topApiKeys.map(async (item) => {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: item.apiKeyId },
        select: { name: true, description: true, userId: true }
      });
      
      const user = apiKey ? await prisma.user.findUnique({
        where: { id: apiKey.userId },
        select: { email: true, username: true }
      }) : null;
      
      return {
        id: item.apiKeyId,
        name: apiKey?.name || 'Unknown',
        description: apiKey?.description,
        requestCount: item._count.id,
        user: user ? { email: user.email, username: user.username } : null
      };
    })
  );

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        activeUsers,
        totalApiKeys,
        activeApiKeys
      },
      requests: {
        last24Hours: totalRequests24h,
        last7Days: totalRequests7d,
        last30Days: totalRequests30d
      },
      growth: {
        users: {
          last24Hours: newUsers24h,
          last7Days: newUsers7d,
          last30Days: newUsers30d
        },
        apiKeys: {
          last24Hours: newApiKeys24h,
          last7Days: newApiKeys7d,
          last30Days: newApiKeys30d
        }
      },
      topUsers: topUsers.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        name: `${user.firstName} ${user.lastName}`,
        apiKeyCount: user._count.apiKeys
      })),
      topApiKeys: topApiKeysDetails
    }
  });
}));

/**
 * @swagger
 * /api/system/backup:
 *   post:
 *     summary: Create system backup
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System backup created successfully
 */
router.post('/backup', checkPermission('system:update'), asyncHandler(async (req, res) => {
  // This is a placeholder for backup functionality
  // In a real implementation, you would:
  // 1. Create database dump
  // 2. Backup configuration files
  // 3. Compress and store backup
  // 4. Return backup file location

  const backupId = `backup-${Date.now()}`;
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'BACKUP',
      resource: 'System',
      resourceId: backupId,
      details: { backupId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    message: 'System backup initiated successfully',
    data: {
      backupId,
      status: 'in_progress',
      estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    }
  });
}));

/**
 * @swagger
 * /api/system/maintenance:
 *   post:
 *     summary: Toggle maintenance mode
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maintenance mode updated successfully
 */
router.post('/maintenance', [
  checkPermission('system:update'),
  body('enabled').isBoolean(),
  body('message').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { enabled, message } = req.body;

  // Update app settings
  const appSettings = await prisma.systemConfig.findUnique({
    where: { key: 'app_settings' }
  });

  const updatedSettings = {
    ...appSettings?.value,
    maintenanceMode: enabled,
    maintenanceMessage: message || 'System is under maintenance. Please try again later.'
  };

  await prisma.systemConfig.upsert({
    where: { key: 'app_settings' },
    update: { value: updatedSettings },
    create: { key: 'app_settings', value: updatedSettings }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: enabled ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
      resource: 'System',
      resourceId: 'maintenance',
      details: { enabled, message },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`,
    data: {
      maintenanceMode: enabled,
      message: updatedSettings.maintenanceMessage
    }
  });
}));

module.exports = router; 