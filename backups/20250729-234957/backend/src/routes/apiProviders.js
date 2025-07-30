const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/api-providers:
 *   get:
 *     summary: Get all API providers
 *     tags: [API Providers]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of API providers
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const providers = await prisma.aPIProvider.findMany({
    include: {
      endpoints: {
        where: { isActive: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: providers
  });
}));

/**
 * @swagger
 * /api/api-providers/{id}:
 *   get:
 *     summary: Get single API provider
 *     tags: [API Providers]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API provider details
 */
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const provider = await prisma.aPIProvider.findUnique({
    where: { id },
    include: {
      endpoints: {
        where: { isActive: true }
      }
    }
  });

  if (!provider) {
    return res.status(404).json({
      success: false,
      message: 'API Provider not found'
    });
  }

  res.json({
    success: true,
    data: provider
  });
}));

/**
 * @swagger
 * /api/api-providers:
 *   post:
 *     summary: Create new API provider
 *     tags: [API Providers]
 *     security:
 *       - apiKeyAuth: []
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
 *               baseUrl:
 *                 type: string
 *               requiresAuth:
 *                 type: boolean
 *               authType:
 *                 type: string
 *               authConfig:
 *                 type: object
 *               rateLimit:
 *                 type: number
 *               timeout:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *               endpoints:
 *                 type: array
 *     responses:
 *       201:
 *         description: API provider created
 */
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    name,
    description,
    baseUrl,
    documentation,
    requiresAuth,
    authType,
    authConfig,
    rateLimit,
    timeout,
    isActive,
    endpoints
  } = req.body;

  // Validate required fields
  if (!name || !description || !baseUrl) {
    return res.status(400).json({
      success: false,
      message: 'Name, description, and baseUrl are required'
    });
  }

  // Check if provider name already exists
  const existingProvider = await prisma.aPIProvider.findUnique({
    where: { name }
  });

  if (existingProvider) {
    return res.status(400).json({
      success: false,
      message: 'Provider name already exists'
    });
  }

  // Create provider with endpoints
  const provider = await prisma.aPIProvider.create({
    data: {
      name,
      description,
      baseUrl,
      documentation,
      requiresAuth: requiresAuth || false,
      authType: authType || 'none',
      authConfig: authConfig || null,
      rateLimit: rateLimit || 1000,
      timeout: timeout || 10000,
      isActive: isActive !== undefined ? isActive : true,
      endpoints: {
        create: endpoints || []
      }
    },
    include: {
      endpoints: true
    }
  });

  res.status(201).json({
    success: true,
    data: provider
  });
}));

/**
 * @swagger
 * /api/api-providers/{id}:
 *   put:
 *     summary: Update API provider
 *     tags: [API Providers]
 *     security:
 *       - apiKeyAuth: []
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
 *     responses:
 *       200:
 *         description: API provider updated
 */
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove endpoints from update data as they need special handling
  const { endpoints, ...providerData } = updateData;

  const provider = await prisma.aPIProvider.update({
    where: { id },
    data: providerData,
    include: {
      endpoints: true
    }
  });

  res.json({
    success: true,
    data: provider
  });
}));

/**
 * @swagger
 * /api/api-providers/{id}:
 *   delete:
 *     summary: Delete API provider
 *     tags: [API Providers]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API provider deleted
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.aPIProvider.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'API Provider deleted successfully'
  });
}));

/**
 * @swagger
 * /api/api-providers/{id}/status:
 *   patch:
 *     summary: Toggle API provider status
 *     tags: [API Providers]
 *     security:
 *       - apiKeyAuth: []
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
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: API provider status updated
 */
router.patch('/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const provider = await prisma.aPIProvider.update({
    where: { id },
    data: { isActive },
    include: {
      endpoints: true
    }
  });

  res.json({
    success: true,
    data: provider
  });
}));

module.exports = router; 