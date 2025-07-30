const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const databaseConnectionService = require('../services/databaseConnectionService');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/database-connections:
 *   get:
 *     summary: Get all database connections
 *     tags: [Database Connections]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of database connections
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const connections = await prisma.databaseConnection.findMany({
    include: {
      queries: {
        where: { isActive: true }
      },
      _count: {
        select: {
          queries: true,
          logs: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: connections
  });
}));

/**
 * @swagger
 * /api/database-connections/{id}:
 *   get:
 *     summary: Get single database connection
 *     tags: [Database Connections]
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
 *         description: Database connection details
 */
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const connection = await prisma.databaseConnection.findUnique({
    where: { id },
    include: {
      queries: {
        where: { isActive: true }
      },
      logs: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!connection) {
    return res.status(404).json({
      success: false,
      message: 'Database connection not found'
    });
  }

  res.json({
    success: true,
    data: connection
  });
}));

/**
 * @swagger
 * /api/database-connections:
 *   post:
 *     summary: Create new database connection
 *     tags: [Database Connections]
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
 *               host:
 *                 type: string
 *               port:
 *                 type: number
 *               database:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               useSSL:
 *                 type: boolean
 *               useTunnel:
 *                 type: boolean
 *               tunnelConfig:
 *                 type: object
 *     responses:
 *       201:
 *         description: Database connection created
 */
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    name,
    description,
    host,
    port,
    database,
    username,
    password,
    useSSL,
    useTunnel,
    tunnelConfig
  } = req.body;

  // Validate required fields
  if (!name || !host || !database || !username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, host, database, username, and password are required'
    });
  }

  // Check if connection name already exists
  const existingConnection = await prisma.databaseConnection.findUnique({
    where: { name }
  });

  if (existingConnection) {
    return res.status(400).json({
      success: false,
      message: 'Connection name already exists'
    });
  }

  // Test connection before saving (optional - don't fail if test fails)
  try {
    const testResult = await databaseConnectionService.testConnection({
      host,
      port: port || 3306,
      database,
      username,
      password,
      useSSL: useSSL || false,
      useTunnel: useTunnel || false,
      tunnelConfig
    });

    if (!testResult.success) {
      console.log(`Connection test failed for new connection:`, testResult.message);
      // Continue with creation even if test fails
    }
  } catch (error) {
    console.log(`Connection test error for new connection:`, error.message);
    // Continue with creation even if test fails
  }

  // Create connection
  const connection = await prisma.databaseConnection.create({
    data: {
      name,
      description,
      host,
      port: port || 3306,
      database,
      username,
      password,
      useSSL: useSSL || false,
      useTunnel: useTunnel || false,
      tunnelConfig: tunnelConfig || null
    }
  });

  res.status(201).json({
    success: true,
    data: connection
  });
}));

/**
 * @swagger
 * /api/database-connections/{id}:
 *   put:
 *     summary: Update database connection
 *     tags: [Database Connections]
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
 *         description: Database connection updated
 */
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Test connection if credentials changed (optional - don't fail if test fails)
  if (updateData.host || updateData.port || updateData.database || 
      updateData.username || updateData.password || updateData.useSSL || 
      updateData.useTunnel || updateData.tunnelConfig) {
    
    const currentConnection = await prisma.databaseConnection.findUnique({
      where: { id }
    });

    if (!currentConnection) {
      return res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
    }

    const testConfig = {
      host: updateData.host || currentConnection.host,
      port: updateData.port || currentConnection.port,
      database: updateData.database || currentConnection.database,
      username: updateData.username || currentConnection.username,
      password: updateData.password || currentConnection.password,
      useSSL: updateData.useSSL !== undefined ? updateData.useSSL : currentConnection.useSSL,
      useTunnel: updateData.useTunnel !== undefined ? updateData.useTunnel : currentConnection.useTunnel,
      tunnelConfig: updateData.tunnelConfig || currentConnection.tunnelConfig
    };

    try {
      const testResult = await databaseConnectionService.testConnection(testConfig);
      if (!testResult.success) {
        console.log(`Connection test failed for connection ${id}:`, testResult.message);
        // Continue with update even if test fails
      }
    } catch (error) {
      console.log(`Connection test error for connection ${id}:`, error.message);
      // Continue with update even if test fails
    }
  }

  const connection = await prisma.databaseConnection.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    data: connection
  });
}));

/**
 * @swagger
 * /api/database-connections/{id}:
 *   delete:
 *     summary: Delete database connection
 *     tags: [Database Connections]
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
 *         description: Database connection deleted
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Close any active connections
  await databaseConnectionService.closeConnection(id);

  await prisma.databaseConnection.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Database connection deleted successfully'
  });
}));

/**
 * @swagger
 * /api/database-connections/{id}/test:
 *   post:
 *     summary: Test database connection
 *     tags: [Database Connections]
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
 *         description: Connection test result
 */
router.post('/:id/test', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const connection = await prisma.databaseConnection.findUnique({
    where: { id }
  });

  if (!connection) {
    return res.status(404).json({
      success: false,
      message: 'Database connection not found'
    });
  }

  const testResult = await databaseConnectionService.testConnection(connection);

  res.json({
    success: true,
    data: testResult
  });
}));

/**
 * @swagger
 * /api/database-connections/{id}/schema:
 *   get:
 *     summary: Get database schema
 *     tags: [Database Connections]
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
 *         description: Database schema
 */
router.get('/:id/schema', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const connection = await prisma.databaseConnection.findUnique({
    where: { id }
  });

  if (!connection) {
    return res.status(404).json({
      success: false,
      message: 'Database connection not found'
    });
  }

  try {
    const schema = await databaseConnectionService.getSchema(id);
    
    res.json({
      success: true,
      data: schema
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

module.exports = router; 