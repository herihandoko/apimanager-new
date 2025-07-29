const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkPermission, requireOwnerOrAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Generate a secure API key
 */
const generateApiKey = () => {
  return `ak_${crypto.randomBytes(32).toString('hex')}`;
};

/**
 * @swagger
 * /api/apikeys:
 *   get:
 *     summary: Get all API keys for current user
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API keys retrieved successfully
 */
router.get('/', checkPermission('apikey:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;

  const where = {
    userId: req.user.id,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  const [apiKeys, total] = await Promise.all([
    prisma.apiKey.findMany({
      where,
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
        permissions: true,
        rateLimit: true,
        ipWhitelist: true,
        isActive: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: parseInt(limit)
    }),
    prisma.apiKey.count({ where })
  ]);

  // Transform data to match frontend expectations
  const transformedApiKeys = apiKeys.map(key => ({
    id: key.id,
    name: key.name,
    key: key.key,
    description: key.description,
    permissions: key.permissions,
    rateLimit: key.rateLimit,
    isActive: key.isActive,
    lastUsed: key.lastUsedAt ? key.lastUsedAt.toISOString() : new Date().toISOString(),
    createdAt: key.createdAt.toISOString(),
    expiresAt: key.expiresAt ? key.expiresAt.toISOString() : null,
    userId: req.user.id,
    usage: {
      total: Math.floor(Math.random() * 10000) + 1000, // Mock data
      today: Math.floor(Math.random() * 500) + 10, // Mock data
      thisMonth: Math.floor(Math.random() * 5000) + 500 // Mock data
    }
  }));

  res.json({
    success: true,
    data: transformedApiKeys
  });
}));

/**
 * @swagger
 * /api/apikeys/stats:
 *   get:
 *     summary: Get API key statistics for current user
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API key statistics retrieved successfully
 */
router.get('/stats', checkPermission('apikey:read'), asyncHandler(async (req, res) => {
  // Get API key statistics for current user
  const [totalKeys, activeKeys, expiringSoon, totalRequests] = await Promise.all([
    // Total API keys
    prisma.apiKey.count({
      where: { userId: req.user.id }
    }),
    // Active API keys
    prisma.apiKey.count({
      where: { 
        userId: req.user.id,
        isActive: true
      }
    }),
    // Expiring soon (within 30 days)
    prisma.apiKey.count({
      where: {
        userId: req.user.id,
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      }
    }),
    // Total requests from apiLog table
    prisma.apiLog.count({
      where: {
        apiKey: {
          userId: req.user.id
        }
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      totalKeys,
      activeKeys,
      expiringSoon,
      totalRequests
    }
  });
}));

/**
 * @swagger
 * /api/apikeys/validate:
 *   post:
 *     summary: Validate API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *     responses:
 *       200:
 *         description: API key validation result
 */
router.post('/validate', checkPermission('apikey:read'), asyncHandler(async (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({
      success: false,
      message: 'API key is required'
    });
  }

  // Find API key by hash
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });

  if (!apiKey) {
    return res.json({
      success: true,
      data: {
        isValid: false,
        permissions: [],
        rateLimit: 0,
        usage: {
          total: 0,
          today: 0,
          thisMonth: 0
        }
      }
    });
  }

  // Get usage statistics
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalRequests, todayRequests, thisMonthRequests] = await Promise.all([
    // Total requests (mock data)
    Promise.resolve(15420),
    // Today's requests (mock data)
    Promise.resolve(234),
    // This month's requests (mock data)
    Promise.resolve(5430)
  ]);

  res.json({
    success: true,
    data: {
      isValid: true,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
      usage: {
        total: totalRequests,
        today: todayRequests,
        thisMonth: thisMonthRequests
      }
    }
  });
}));

/**
 * @swagger
 * /api/apikeys:
 *   post:
 *     summary: Create a new API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               rateLimit:
 *                 type: integer
 *               ipWhitelist:
 *                 type: array
 *                 items:
 *                   type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: API key created successfully
 */
router.post('/', [
  checkPermission('apikey:create'),
  body('name').trim().notEmpty().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('permissions').optional().isArray(),
  body('rateLimit').optional().isInt({ min: 1, max: 10000 }),
  body('ipWhitelist').optional().isArray(),
  body('expiresAt').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { name, description, permissions, rateLimit, ipWhitelist, expiresAt } = req.body;

  // Check if user has reached API key limit
  const apiKeyCount = await prisma.apiKey.count({
    where: { userId: req.user.id }
  });

  const systemConfig = await prisma.systemConfig.findUnique({
    where: { key: 'app_settings' }
  });

  const maxApiKeys = systemConfig?.value?.maxApiKeysPerUser || 10;

  if (apiKeyCount >= maxApiKeys) {
    return res.status(400).json({
      success: false,
      message: `Maximum number of API keys (${maxApiKeys}) reached`
    });
  }

  // Generate API key
  const apiKey = generateApiKey();
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  // Create API key
  const newApiKey = await prisma.apiKey.create({
    data: {
      name,
      key: apiKey,
      keyHash,
      description,
      permissions: permissions || [],
      rateLimit: rateLimit || 1000,
      ipWhitelist: ipWhitelist || [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      userId: req.user.id
    },
    select: {
      id: true,
      name: true,
      key: true,
      description: true,
      permissions: true,
      rateLimit: true,
      ipWhitelist: true,
      isActive: true,
      expiresAt: true,
      createdAt: true
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'CREATE',
      resource: 'ApiKey',
      resourceId: newApiKey.id,
      details: { name, description },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // Transform response to match frontend expectations
  const transformedApiKey = {
    id: newApiKey.id,
    name: newApiKey.name,
    key: newApiKey.key,
    description: newApiKey.description,
    permissions: newApiKey.permissions,
    rateLimit: newApiKey.rateLimit,
    isActive: newApiKey.isActive,
    lastUsed: new Date().toISOString(),
    createdAt: newApiKey.createdAt.toISOString(),
    expiresAt: newApiKey.expiresAt ? newApiKey.expiresAt.toISOString() : null,
    userId: req.user.id,
    usage: {
      total: 0,
      today: 0,
      thisMonth: 0
    }
  };

  res.status(201).json({
    success: true,
    message: 'API key created successfully',
    data: transformedApiKey
  });
}));

/**
 * @swagger
 * /api/apikeys/{id}:
 *   get:
 *     summary: Get API key by ID
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key retrieved successfully
 */
router.get('/:id', checkPermission('apikey:read'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id,
      userId: req.user.id
    },
    select: {
      id: true,
      name: true,
      key: true,
      description: true,
      permissions: true,
      rateLimit: true,
      ipWhitelist: true,
      isActive: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!apiKey) {
    return res.status(404).json({
      success: false,
      message: 'API key not found'
    });
  }

  // Transform response to match frontend expectations
  const transformedApiKey = {
    id: apiKey.id,
    name: apiKey.name,
    key: apiKey.key,
    description: apiKey.description,
    permissions: apiKey.permissions,
    rateLimit: apiKey.rateLimit,
    isActive: apiKey.isActive,
    lastUsed: apiKey.lastUsedAt ? apiKey.lastUsedAt.toISOString() : new Date().toISOString(),
    createdAt: apiKey.createdAt.toISOString(),
    expiresAt: apiKey.expiresAt ? apiKey.expiresAt.toISOString() : null,
    userId: req.user.id,
    usage: {
      total: Math.floor(Math.random() * 10000) + 1000, // Mock data
      today: Math.floor(Math.random() * 500) + 10, // Mock data
      thisMonth: Math.floor(Math.random() * 5000) + 500 // Mock data
    }
  };

  res.json({
    success: true,
    data: transformedApiKey
  });
}));

/**
 * @swagger
 * /api/apikeys/{id}:
 *   put:
 *     summary: Update API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               rateLimit:
 *                 type: integer
 *               ipWhitelist:
 *                 type: array
 *                 items:
 *                   type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: API key updated successfully
 */
router.put('/:id', [
  checkPermission('apikey:update'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('permissions').optional().isArray(),
  body('rateLimit').optional().isInt({ min: 1, max: 10000 }),
  body('ipWhitelist').optional().isArray(),
  body('expiresAt').optional().isISO8601(),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if API key exists and belongs to user
  const existingApiKey = await prisma.apiKey.findFirst({
    where: {
      id,
      userId: req.user.id
    }
  });

  if (!existingApiKey) {
    return res.status(404).json({
      success: false,
      message: 'API key not found'
    });
  }

  // Update API key
  const updatedApiKey = await prisma.apiKey.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      key: true,
      description: true,
      permissions: true,
      rateLimit: true,
      ipWhitelist: true,
      isActive: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'ApiKey',
      resourceId: id,
      details: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // Transform response to match frontend expectations
  const transformedApiKey = {
    id: updatedApiKey.id,
    name: updatedApiKey.name,
    key: updatedApiKey.key,
    description: updatedApiKey.description,
    permissions: updatedApiKey.permissions,
    rateLimit: updatedApiKey.rateLimit,
    isActive: updatedApiKey.isActive,
    lastUsed: updatedApiKey.lastUsedAt ? updatedApiKey.lastUsedAt.toISOString() : new Date().toISOString(),
    createdAt: updatedApiKey.createdAt.toISOString(),
    expiresAt: updatedApiKey.expiresAt ? updatedApiKey.expiresAt.toISOString() : null,
    userId: req.user.id,
    usage: {
      total: Math.floor(Math.random() * 10000) + 1000, // Mock data
      today: Math.floor(Math.random() * 500) + 10, // Mock data
      thisMonth: Math.floor(Math.random() * 5000) + 500 // Mock data
    }
  };

  res.json({
    success: true,
    message: 'API key updated successfully',
    data: transformedApiKey
  });
}));

/**
 * @swagger
 * /api/apikeys/{id}:
 *   delete:
 *     summary: Delete API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key deleted successfully
 */
router.delete('/:id', checkPermission('apikey:delete'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if API key exists and belongs to user
  const existingApiKey = await prisma.apiKey.findFirst({
    where: {
      id,
      userId: req.user.id
    }
  });

  if (!existingApiKey) {
    return res.status(404).json({
      success: false,
      message: 'API key not found'
    });
  }

  // Delete API key
  await prisma.apiKey.delete({
    where: { id }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'DELETE',
      resource: 'ApiKey',
      resourceId: id,
      details: { name: existingApiKey.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    message: 'API key deleted successfully'
  });
}));

/**
 * @swagger
 * /api/apikeys/{id}/regenerate:
 *   post:
 *     summary: Regenerate API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key regenerated successfully
 */
router.post('/:id/regenerate', checkPermission('apikey:update'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if API key exists and belongs to user
  const existingApiKey = await prisma.apiKey.findFirst({
    where: {
      id,
      userId: req.user.id
    }
  });

  if (!existingApiKey) {
    return res.status(404).json({
      success: false,
      message: 'API key not found'
    });
  }

  // Generate new API key
  const newApiKey = generateApiKey();
  const keyHash = crypto.createHash('sha256').update(newApiKey).digest('hex');

  // Update API key
  const updatedApiKey = await prisma.apiKey.update({
    where: { id },
    data: {
      key: newApiKey,
      keyHash,
      updatedAt: new Date()
    },
    select: {
      id: true,
      name: true,
      key: true,
      description: true,
      permissions: true,
      rateLimit: true,
      ipWhitelist: true,
      isActive: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'REGENERATE',
      resource: 'ApiKey',
      resourceId: id,
      details: { name: existingApiKey.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // Transform response to match frontend expectations
  const transformedApiKey = {
    id: updatedApiKey.id,
    name: updatedApiKey.name,
    key: updatedApiKey.key,
    description: updatedApiKey.description,
    permissions: updatedApiKey.permissions,
    rateLimit: updatedApiKey.rateLimit,
    isActive: updatedApiKey.isActive,
    lastUsed: updatedApiKey.lastUsedAt ? updatedApiKey.lastUsedAt.toISOString() : new Date().toISOString(),
    createdAt: updatedApiKey.createdAt.toISOString(),
    expiresAt: updatedApiKey.expiresAt ? updatedApiKey.expiresAt.toISOString() : null,
    userId: req.user.id,
    usage: {
      total: Math.floor(Math.random() * 10000) + 1000, // Mock data
      today: Math.floor(Math.random() * 500) + 10, // Mock data
      thisMonth: Math.floor(Math.random() * 5000) + 500 // Mock data
    }
  };

  res.json({
    success: true,
    message: 'API key regenerated successfully',
    data: transformedApiKey
  });
}));

/**
 * @swagger
 * /api/apikeys/{id}/usage:
 *   get:
 *     summary: Get API key usage statistics
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 */
router.get('/:id/usage', checkPermission('apikey:read'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { period = '24h' } = req.query;

  // Check if API key exists and belongs to user
  const existingApiKey = await prisma.apiKey.findFirst({
    where: {
      id,
      userId: req.user.id
    }
  });

  if (!existingApiKey) {
    return res.status(404).json({
      success: false,
      message: 'API key not found'
    });
  }

  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '1h':
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // Get usage statistics
  const [totalRequests, successRequests, errorRequests, avgResponseTime] = await Promise.all([
    prisma.apiLog.count({
      where: {
        apiKeyId: id,
        createdAt: { gte: startDate }
      }
    }),
    prisma.apiLog.count({
      where: {
        apiKeyId: id,
        statusCode: { gte: 200, lt: 300 },
        createdAt: { gte: startDate }
      }
    }),
    prisma.apiLog.count({
      where: {
        apiKeyId: id,
        statusCode: { gte: 400 },
        createdAt: { gte: startDate }
      }
    }),
    prisma.apiLog.aggregate({
      where: {
        apiKeyId: id,
        createdAt: { gte: startDate }
      },
      _avg: {
        responseTime: true
      }
    })
  ]);

  // Get hourly/daily usage data
  const usageData = await prisma.apiLog.groupBy({
    by: ['createdAt'],
    where: {
      apiKeyId: id,
      createdAt: { gte: startDate }
    },
    _count: {
      id: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  res.json({
    success: true,
    data: {
      period,
      totalRequests,
      successRequests,
      errorRequests,
      successRate: totalRequests > 0 ? (successRequests / totalRequests * 100).toFixed(2) : 0,
      avgResponseTime: avgResponseTime._avg.responseTime || 0,
      usageData: usageData.map(item => ({
        date: item.createdAt,
        count: item._count.id
      }))
    }
  });
}));

module.exports = router; 