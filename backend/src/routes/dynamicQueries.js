const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const databaseConnectionService = require('../services/databaseConnectionService');
const NodeCache = require('node-cache');

const router = express.Router();
const prisma = new PrismaClient();
const queryCache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

/**
 * @swagger
 * /api/dynamic-queries:
 *   get:
 *     summary: Get all dynamic queries
 *     tags: [Dynamic Queries]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of dynamic queries
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const queries = await prisma.dynamicQuery.findMany({
    include: {
      connection: {
        select: {
          id: true,
          name: true,
          host: true,
          database: true
        }
      },
      _count: {
        select: {
          logs: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: queries
  });
}));

/**
 * @swagger
 * /api/dynamic-queries/{id}:
 *   get:
 *     summary: Get single dynamic query
 *     tags: [Dynamic Queries]
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
 *         description: Dynamic query details
 */
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = await prisma.dynamicQuery.findUnique({
    where: { id },
    include: {
      connection: {
        select: {
          id: true,
          name: true,
          host: true,
          database: true
        }
      },
      logs: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!query) {
    return res.status(404).json({
      success: false,
      message: 'Dynamic query not found'
    });
  }

  res.json({
    success: true,
    data: query
  });
}));

/**
 * @swagger
 * /api/dynamic-queries:
 *   post:
 *     summary: Create new dynamic query
 *     tags: [Dynamic Queries]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               connectionId:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               query:
 *                 type: string
 *               method:
 *                 type: string
 *               path:
 *                 type: string
 *               parameters:
 *                 type: object
 *               responseFormat:
 *                 type: string
 *               cacheEnabled:
 *                 type: boolean
 *               cacheDuration:
 *                 type: number
 *               rateLimit:
 *                 type: number
 *     responses:
 *       201:
 *         description: Dynamic query created
 */
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    connectionId,
    name,
    description,
    query,
    method,
    path,
    parameters,
    responseFormat,
    cacheEnabled,
    cacheDuration,
    rateLimit
  } = req.body;

  // Validate required fields
  if (!connectionId || !name || !query || !method || !path) {
    return res.status(400).json({
      success: false,
      message: 'Connection ID, name, query, method, and path are required'
    });
  }

  // Check if connection exists
  const connection = await prisma.databaseConnection.findUnique({
    where: { id: connectionId }
  });

  if (!connection) {
    return res.status(400).json({
      success: false,
      message: 'Database connection not found'
    });
  }

  // Check if path already exists for this connection
  const existingQuery = await prisma.dynamicQuery.findFirst({
    where: {
      connectionId,
      path,
      method
    }
  });

  if (existingQuery) {
    return res.status(400).json({
      success: false,
      message: 'Path and method combination already exists for this connection'
    });
  }

  // Test query before saving (optional - don't fail if test fails)
  try {
    await databaseConnectionService.executeQuery(connectionId, query, []);
  } catch (error) {
    console.log(`Query test failed for new query:`, error.message);
    // Continue with creation even if test fails
  }

  // Create query
  const dynamicQuery = await prisma.dynamicQuery.create({
    data: {
      connectionId,
      name,
      description,
      query,
      method: method.toUpperCase(),
      path,
      parameters: parameters || null,
      responseFormat: responseFormat || 'json',
      cacheEnabled: cacheEnabled || false,
      cacheDuration: cacheDuration || 300,
      rateLimit: rateLimit || 1000
    },
    include: {
      connection: {
        select: {
          id: true,
          name: true,
          host: true,
          database: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: dynamicQuery
  });
}));

/**
 * @swagger
 * /api/dynamic-queries/{id}:
 *   put:
 *     summary: Update dynamic query
 *     tags: [Dynamic Queries]
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
 *         description: Dynamic query updated
 */
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Test query if it changed
  if (updateData.query) {
    const currentQuery = await prisma.dynamicQuery.findUnique({
      where: { id },
      include: { connection: true }
    });

    if (!currentQuery) {
      return res.status(404).json({
        success: false,
        message: 'Dynamic query not found'
      });
    }

    try {
      await databaseConnectionService.executeQuery(
        currentQuery.connectionId, 
        updateData.query, 
        []
      );
    } catch (error) {
      // Log error but don't fail the update
      console.log(`Query test failed for query ${id}:`, error.message);
      // Continue with update even if test fails
    }
  }

  const query = await prisma.dynamicQuery.update({
    where: { id },
    data: updateData,
    include: {
      connection: {
        select: {
          id: true,
          name: true,
          host: true,
          database: true
        }
      }
    }
  });

  // Clear cache for this query
  queryCache.del(id);

  res.json({
    success: true,
    data: query
  });
}));

/**
 * @swagger
 * /api/dynamic-queries/{id}:
 *   delete:
 *     summary: Delete dynamic query
 *     tags: [Dynamic Queries]
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
 *         description: Dynamic query deleted
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.dynamicQuery.delete({
    where: { id }
  });

  // Clear cache
  queryCache.del(id);

  res.json({
    success: true,
    message: 'Dynamic query deleted successfully'
  });
}));

/**
 * @swagger
 * /api/dynamic-queries/{id}/execute:
 *   post:
 *     summary: Execute dynamic query
 *     tags: [Dynamic Queries]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Query execution result
 */
router.post('/:id/execute', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { params = [] } = req.body;

  const query = await prisma.dynamicQuery.findUnique({
    where: { id },
    include: {
      connection: true
    }
  });

  if (!query) {
    return res.status(404).json({
      success: false,
      message: 'Dynamic query not found'
    });
  }

  if (!query.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Query is inactive'
    });
  }

  // Check cache first
  if (query.cacheEnabled) {
    const cacheKey = `${id}:${JSON.stringify(params)}`;
    const cachedResult = queryCache.get(cacheKey);
    if (cachedResult) {
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }
  }

  const startTime = Date.now();

  try {
    // Execute query
    const result = await databaseConnectionService.executeQuery(
      query.connectionId,
      query.query,
      params
    );

    const duration = Date.now() - startTime;

    // Log execution
    await prisma.dynamicQueryLog.create({
      data: {
        queryId: id,
        method: query.method,
        path: query.path,
        status: 200,
        duration,
        responseSize: JSON.stringify(result).length,
        success: true
      }
    });

    // Cache result if enabled
    if (query.cacheEnabled) {
      const cacheKey = `${id}:${JSON.stringify(params)}`;
      queryCache.set(cacheKey, result, query.cacheDuration);
    }

    res.json({
      success: true,
      data: result,
      metadata: {
        duration,
        responseSize: JSON.stringify(result).length,
        cached: false
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error
    await prisma.dynamicQueryLog.create({
      data: {
        queryId: id,
        method: query.method,
        path: query.path,
        status: 500,
        duration,
        responseSize: 0,
        success: false,
        error: error.message
      }
    });

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

/**
 * @swagger
 * /api/dynamic-queries/{id}/test:
 *   post:
 *     summary: Test dynamic query
 *     tags: [Dynamic Queries]
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
 *         description: Query test result
 */
router.post('/:id/test', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = await prisma.dynamicQuery.findUnique({
    where: { id },
    include: {
      connection: true
    }
  });

  if (!query) {
    return res.status(404).json({
      success: false,
      message: 'Dynamic query not found'
    });
  }

  try {
    const result = await databaseConnectionService.executeQuery(
      query.connectionId,
      query.query,
      []
    );

    res.json({
      success: true,
      data: {
        message: 'Query executed successfully',
        rowCount: Array.isArray(result) ? result.length : 1,
        sampleData: Array.isArray(result) ? result.slice(0, 3) : result
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

module.exports = router; 