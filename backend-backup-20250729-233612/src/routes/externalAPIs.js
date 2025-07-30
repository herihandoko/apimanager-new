const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();
const prisma = new PrismaClient();

// Get all external APIs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const externalAPIs = await prisma.externalAPI.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: externalAPIs,
    });
  } catch (error) {
    console.error('Error fetching external APIs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external APIs',
    });
  }
});

// Get external API by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const externalAPI = await prisma.externalAPI.findUnique({
      where: { id },
    });

    if (!externalAPI) {
      return res.status(404).json({
        success: false,
        message: 'External API not found',
      });
    }

    res.json({
      success: true,
      data: externalAPI,
    });
  } catch (error) {
    console.error('Error fetching external API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external API',
    });
  }
});

// Create new external API
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      baseUrl,
      endpoint,
      method,
      requiresAuth,
      authType,
      authConfig,
      rateLimit,
      timeout,
      isActive,
    } = req.body;

    // Validate required fields
    if (!name || !description || !baseUrl || !endpoint || !method) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Validate URL
    try {
      new URL(baseUrl);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid base URL',
      });
    }

    const externalAPI = await prisma.externalAPI.create({
      data: {
        name,
        description,
        baseUrl,
        endpoint,
        method,
        requiresAuth: requiresAuth || false,
        authType: authType || 'none',
        authConfig: authConfig || {},
        rateLimit: rateLimit || 1000,
        timeout: timeout || 10000,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({
      success: true,
      data: externalAPI,
    });
  } catch (error) {
    console.error('Error creating external API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create external API',
    });
  }
});

// Update external API
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove id from update data if present
    delete updateData.id;

    // Validate URL if provided
    if (updateData.baseUrl) {
      try {
        new URL(updateData.baseUrl);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Invalid base URL',
        });
      }
    }

    const externalAPI = await prisma.externalAPI.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: externalAPI,
    });
  } catch (error) {
    console.error('Error updating external API:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'External API not found',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update external API',
    });
  }
});

// Delete external API
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.externalAPI.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'External API deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting external API:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'External API not found',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete external API',
    });
  }
});

// Toggle external API status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean',
      });
    }

    const externalAPI = await prisma.externalAPI.update({
      where: { id },
      data: { isActive },
    });

    res.json({
      success: true,
      data: externalAPI,
    });
  } catch (error) {
    console.error('Error toggling external API status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'External API not found',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to toggle external API status',
    });
  }
});

// Test external API
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { params = {}, body } = req.body;

    const externalAPI = await prisma.externalAPI.findUnique({
      where: { id },
    });

    if (!externalAPI) {
      return res.status(404).json({
        success: false,
        message: 'External API not found',
      });
    }

    if (!externalAPI.isActive) {
      return res.status(400).json({
        success: false,
        message: 'External API is not active',
      });
    }

    // Build the full URL
    let fullUrl = externalAPI.baseUrl + externalAPI.endpoint;
    
    // Replace path parameters
    Object.keys(params).forEach(key => {
      fullUrl = fullUrl.replace(`{${key}}`, params[key]);
    });

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
    };

    if (externalAPI.requiresAuth && externalAPI.authConfig) {
      headers[externalAPI.authConfig.headerName] = externalAPI.authConfig.headerValue;
    }

    // Prepare request options
    const requestOptions = {
      method: externalAPI.method,
      headers,
      timeout: externalAPI.timeout,
    };

    // Add body for non-GET requests
    if (externalAPI.method !== 'GET' && body) {
      requestOptions.data = body;
    }

    const startTime = Date.now();
    
    // Make the request
    const response = await axios(fullUrl, requestOptions);
    const duration = Date.now() - startTime;

    // Log the API call
    await prisma.externalAPILog.create({
      data: {
        externalAPIId: id,
        method: externalAPI.method,
        url: fullUrl,
        status: response.status,
        duration,
        responseSize: JSON.stringify(response.data).length,
        success: response.status >= 200 && response.status < 300,
      },
    });

    // Update last tested timestamp
    await prisma.externalAPI.update({
      where: { id },
      data: {
        lastTested: new Date(),
        testStatus: response.status >= 200 && response.status < 300 ? 'success' : 'error',
      },
    });

    res.json({
      success: true,
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error testing external API:', error);
    
    // Log the failed API call
    try {
      const { id } = req.params;
      await prisma.externalAPILog.create({
        data: {
          externalAPIId: id,
          method: req.body.method || 'GET',
          url: req.body.url || '',
          status: error.response?.status || 0,
          duration: 0,
          responseSize: 0,
          success: false,
          error: error.message,
        },
      });

      // Update last tested timestamp
      await prisma.externalAPI.update({
        where: { id },
        data: {
          lastTested: new Date(),
          testStatus: 'error',
        },
      });
    } catch (logError) {
      console.error('Error logging API call:', logError);
    }

    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to test external API',
    });
  }
});

// Get external API usage statistics
router.get('/:id/usage', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;

    // Check if external API exists
    const externalAPI = await prisma.externalAPI.findUnique({
      where: { id },
    });

    if (!externalAPI) {
      return res.status(404).json({
        success: false,
        message: 'External API not found',
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get usage statistics
    const [total, today, thisMonth] = await Promise.all([
      prisma.externalAPILog.count({
        where: { externalAPIId: id },
      }),
      prisma.externalAPILog.count({
        where: {
          externalAPIId: id,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      }),
      prisma.externalAPILog.count({
        where: {
          externalAPIId: id,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      }),
    ]);

    // Get daily usage for the period
    const dailyUsage = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM external_api_logs
      WHERE external_api_id = ${id}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    // Get hourly usage for today
    const hourlyUsage = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM external_api_logs
      WHERE external_api_id = ${id}
        AND created_at >= ${new Date(now.getFullYear(), now.getMonth(), now.getDate())}
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;

    res.json({
      success: true,
      data: {
        total,
        today,
        thisMonth,
        daily: dailyUsage,
        hourly: hourlyUsage,
      },
    });
  } catch (error) {
    console.error('Error fetching external API usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external API usage',
    });
  }
});

// Get external API logs
router.get('/:id/logs', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if external API exists
    const externalAPI = await prisma.externalAPI.findUnique({
      where: { id },
    });

    if (!externalAPI) {
      return res.status(404).json({
        success: false,
        message: 'External API not found',
      });
    }

    // Get logs with pagination
    const [logs, total] = await Promise.all([
      prisma.externalAPILog.findMany({
        where: { externalAPIId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.externalAPILog.count({
        where: { externalAPIId: id },
      }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching external API logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external API logs',
    });
  }
});

module.exports = router; 