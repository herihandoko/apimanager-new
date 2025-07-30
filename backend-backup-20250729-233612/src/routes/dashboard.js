const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkPermission } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 */
router.get('/overview', asyncHandler(async (req, res) => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get statistics based on user role
  let whereClause = {};
  if (req.user.role.name !== 'admin') {
    whereClause = { userId: req.user.id };
  }

  const [
    totalApiKeys,
    activeApiKeys,
    totalRequests24h,
    totalRequests7d,
    totalRequests30d,
    successRate24h,
    avgResponseTime24h,
    recentApiLogs,
    topApiKeys
  ] = await Promise.all([
    // Total API keys
    prisma.apiKey.count({ where: whereClause }),
    
    // Active API keys
    prisma.apiKey.count({ 
      where: { 
        ...whereClause,
        isActive: true 
      } 
    }),
    
    // Total requests in last 24 hours
    prisma.apiLog.count({
      where: {
        ...whereClause,
        createdAt: { gte: last24Hours }
      }
    }),
    
    // Total requests in last 7 days
    prisma.apiLog.count({
      where: {
        ...whereClause,
        createdAt: { gte: last7Days }
      }
    }),
    
    // Total requests in last 30 days
    prisma.apiLog.count({
      where: {
        ...whereClause,
        createdAt: { gte: last30Days }
      }
    }),
    
    // Success rate in last 24 hours
    prisma.apiLog.aggregate({
      where: {
        ...whereClause,
        createdAt: { gte: last24Hours }
      },
      _count: { id: true },
      _avg: { responseTime: true }
    }),
    
    // Average response time in last 24 hours
    prisma.apiLog.aggregate({
      where: {
        ...whereClause,
        createdAt: { gte: last24Hours }
      },
      _avg: { responseTime: true }
    }),
    
    // Recent API logs
    prisma.apiLog.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: last24Hours }
      },
      include: {
        apiKey: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    
    // Top API keys by usage
    prisma.apiLog.groupBy({
      by: ['apiKeyId'],
      where: {
        ...whereClause,
        createdAt: { gte: last7Days }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    })
  ]);

  // Calculate success rate
  const successRequests24h = await prisma.apiLog.count({
    where: {
      ...whereClause,
      statusCode: { gte: 200, lt: 300 },
      createdAt: { gte: last24Hours }
    }
  });

  const successRate = totalRequests24h > 0 ? (successRequests24h / totalRequests24h * 100).toFixed(2) : 0;

  // Get top API keys details
  const topApiKeysDetails = await Promise.all(
    topApiKeys.map(async (item) => {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: item.apiKeyId },
        select: { name: true, description: true }
      });
      return {
        id: item.apiKeyId,
        name: apiKey?.name || 'Unknown',
        description: apiKey?.description,
        requestCount: item._count.id
      };
    })
  );

  res.json({
    success: true,
    data: {
      overview: {
        totalApiKeys,
        activeApiKeys,
        totalRequests24h,
        totalRequests7d,
        totalRequests30d,
        successRate: parseFloat(successRate),
        avgResponseTime: avgResponseTime24h._avg.responseTime || 0
      },
      recentActivity: recentApiLogs.map(log => ({
        id: log.id,
        endpoint: log.endpoint,
        method: log.method,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        apiKeyName: log.apiKey?.name || 'Unknown',
        createdAt: log.createdAt
      })),
      topApiKeys: topApiKeysDetails
    }
  });
}));

/**
 * @swagger
 * /api/dashboard/analytics:
 *   get:
 *     summary: Get detailed analytics data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  const { period = '24h' } = req.query;
  
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

  let whereClause = {};
  if (req.user.role.name !== 'admin') {
    whereClause = { userId: req.user.id };
  }

  // Get hourly/daily request data
  const requestData = await prisma.apiLog.groupBy({
    by: ['createdAt'],
    where: {
      ...whereClause,
      createdAt: { gte: startDate }
    },
    _count: { id: true },
    orderBy: { createdAt: 'asc' }
  });

  // Get status code distribution
  const statusCodeData = await prisma.apiLog.groupBy({
    by: ['statusCode'],
    where: {
      ...whereClause,
      createdAt: { gte: startDate }
    },
    _count: { id: true },
    orderBy: { statusCode: 'asc' }
  });

  // Get method distribution
  const methodData = await prisma.apiLog.groupBy({
    by: ['method'],
    where: {
      ...whereClause,
      createdAt: { gte: startDate }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  // Get response time statistics
  const responseTimeStats = await prisma.apiLog.aggregate({
    where: {
      ...whereClause,
      createdAt: { gte: startDate }
    },
    _avg: { responseTime: true },
    _min: { responseTime: true },
    _max: { responseTime: true }
  });

  res.json({
    success: true,
    data: {
      period,
      requestData: requestData.map(item => ({
        date: item.createdAt,
        count: item._count.id
      })),
      statusCodeDistribution: statusCodeData.map(item => ({
        statusCode: item.statusCode,
        count: item._count.id
      })),
      methodDistribution: methodData.map(item => ({
        method: item.method,
        count: item._count.id
      })),
      responseTimeStats: {
        average: responseTimeStats._avg.responseTime || 0,
        minimum: responseTimeStats._min.responseTime || 0,
        maximum: responseTimeStats._max.responseTime || 0
      }
    }
  });
}));

/**
 * @swagger
 * /api/dashboard/errors:
 *   get:
 *     summary: Get recent error logs
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Error logs retrieved successfully
 */
router.get('/errors', asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  let whereClause = {
    statusCode: { gte: 400 }
  };
  
  if (req.user.role.name !== 'admin') {
    whereClause.userId = req.user.id;
  }

  const errorLogs = await prisma.apiLog.findMany({
    where: whereClause,
    include: {
      apiKey: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit)
  });

  res.json({
    success: true,
    data: errorLogs.map(log => ({
      id: log.id,
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.statusCode,
      error: log.error,
      apiKeyName: log.apiKey?.name || 'Unknown',
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt
    }))
  });
}));

/**
 * @swagger
 * /api/dashboard/performance:
 *   get:
 *     summary: Get performance metrics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 */
router.get('/performance', asyncHandler(async (req, res) => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let whereClause = {};
  if (req.user.role.name !== 'admin') {
    whereClause.userId = req.user.id;
  }

  // Get performance metrics
  const [
    avgResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    totalRequests,
    errorRate,
    throughput
  ] = await Promise.all([
    // Average response time
    prisma.apiLog.aggregate({
      where: {
        ...whereClause,
        createdAt: { gte: last24Hours }
      },
      _avg: { responseTime: true }
    }),
    
    // 95th percentile response time
    prisma.$queryRaw`
      SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY "responseTime") as p95
      FROM "api_logs"
      WHERE "createdAt" >= ${last24Hours}
      ${req.user.role.name !== 'admin' ? `AND "userId" = ${req.user.id}` : ''}
    `,
    
    // 99th percentile response time
    prisma.$queryRaw`
      SELECT percentile_cont(0.99) WITHIN GROUP (ORDER BY "responseTime") as p99
      FROM "api_logs"
      WHERE "createdAt" >= ${last24Hours}
      ${req.user.role.name !== 'admin' ? `AND "userId" = ${req.user.id}` : ''}
    `,
    
    // Total requests
    prisma.apiLog.count({
      where: {
        ...whereClause,
        createdAt: { gte: last24Hours }
      }
    }),
    
    // Error rate
    prisma.apiLog.count({
      where: {
        ...whereClause,
        statusCode: { gte: 400 },
        createdAt: { gte: last24Hours }
      }
    }),
    
    // Throughput (requests per hour)
    prisma.apiLog.groupBy({
      by: ['createdAt'],
      where: {
        ...whereClause,
        createdAt: { gte: last24Hours }
      },
      _count: { id: true }
    })
  ]);

  const errorRatePercent = totalRequests > 0 ? (errorRate / totalRequests * 100).toFixed(2) : 0;
  const avgThroughput = throughput.length > 0 ? 
    (totalRequests / throughput.length).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      responseTime: {
        average: avgResponseTime._avg.responseTime || 0,
        p95: p95ResponseTime[0]?.p95 || 0,
        p99: p99ResponseTime[0]?.p99 || 0
      },
      requests: {
        total: totalRequests,
        errorRate: parseFloat(errorRatePercent),
        throughput: parseFloat(avgThroughput)
      }
    }
  });
}));

module.exports = router; 