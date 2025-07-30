const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkPermission } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/audit - Get audit logs with filters
router.get('/', checkPermission('audit:read'), asyncHandler(async (req, res) => {
  const {
    userId,
    action,
    resource,
    severity,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 10
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {};
  
  if (userId) where.userId = userId;
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (resource) where.resource = { contains: resource, mode: 'insensitive' };
  if (severity) where.severity = severity;
  if (status) where.status = status;
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Get audit logs with pagination
  const [auditLogs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    }),
    prisma.auditLog.count({ where })
  ]);

  // Transform data to match frontend interface
  const transformedLogs = auditLogs.map(log => ({
    id: log.id,
    userId: log.userId,
    userEmail: log.user?.email || 'Unknown',
    action: log.action,
    resource: log.resource,
    resourceId: log.resourceId,
    details: log.details,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    timestamp: log.createdAt.toISOString(),
    severity: log.severity || 'low',
    status: log.status || 'success'
  }));

  const pages = Math.ceil(total / take);

  res.json({
    success: true,
    data: transformedLogs,
    pagination: {
      page: parseInt(page),
      limit: take,
      total,
      pages
    }
  });
}));

// GET /api/audit/stats - Get audit statistics (moved to top to avoid conflict with /:id)
router.get('/stats', checkPermission('audit:read'), asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  // Get counts
  const [totalLogs, todayLogs, thisWeekLogs, thisMonthLogs, criticalLogs, failedActions] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: weekAgo
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: monthAgo
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        severity: 'critical'
      }
    }),
    prisma.auditLog.count({
      where: {
        status: 'failure'
      }
    })
  ]);

  // Get top actions
  const topActions = await prisma.auditLog.groupBy({
    by: ['action'],
    _count: {
      action: true
    },
    orderBy: {
      _count: {
        action: 'desc'
      }
    },
    take: 5
  });

  // Get top users
  const topUsers = await prisma.auditLog.groupBy({
    by: ['userId'],
    _count: {
      userId: true
    },
    orderBy: {
      _count: {
        userId: 'desc'
      }
    },
    take: 5
  });

  // Get user emails for top users
  const userIds = topUsers.map(user => user.userId);
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      }
    },
    select: {
      id: true,
      email: true
    }
  });

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user.email;
    return acc;
  }, {});

  const stats = {
    totalLogs,
    todayLogs,
    thisWeekLogs,
    thisMonthLogs,
    criticalLogs,
    failedActions,
    topActions: topActions.map(action => ({
      action: action.action,
      count: action._count.action
    })),
    topUsers: topUsers.map(user => ({
      userEmail: userMap[user.userId] || 'Unknown',
      count: user._count.userId
    }))
  };

  res.json({
    success: true,
    data: stats
  });
}));

// GET /api/audit/:id - Get specific audit log
router.get('/:id', checkPermission('audit:read'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const auditLog = await prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true
        }
      }
    }
  });

  if (!auditLog) {
    return res.status(404).json({
      success: false,
      message: 'Audit log not found'
    });
  }

  const transformedLog = {
    id: auditLog.id,
    userId: auditLog.userId,
    userEmail: auditLog.user?.email || 'Unknown',
    action: auditLog.action,
    resource: auditLog.resource,
    resourceId: auditLog.resourceId,
    details: auditLog.details,
    ipAddress: auditLog.ipAddress,
    userAgent: auditLog.userAgent,
    timestamp: auditLog.createdAt.toISOString(),
    severity: auditLog.severity || 'low',
    status: auditLog.status || 'success'
  };

  res.json({
    success: true,
    data: transformedLog
  });
}));

// POST /api/audit/export - Export audit logs
router.post('/export', checkPermission('audit:read'), asyncHandler(async (req, res) => {
  const {
    userId,
    action,
    resource,
    severity,
    status,
    startDate,
    endDate
  } = req.query;

  // Build where clause
  const where = {};
  
  if (userId) where.userId = userId;
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (resource) where.resource = { contains: resource, mode: 'insensitive' };
  if (severity) where.severity = severity;
  if (status) where.status = status;
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Get audit logs for export
  const auditLogs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Create CSV content
  const csvHeaders = [
    'ID',
    'User ID',
    'User Email',
    'Action',
    'Resource',
    'Resource ID',
    'Details',
    'IP Address',
    'User Agent',
    'Timestamp',
    'Severity',
    'Status'
  ];

  const csvRows = auditLogs.map(log => [
    log.id,
    log.userId,
    log.user?.email || 'Unknown',
    log.action,
    log.resource,
    log.resourceId || '',
    `"${log.details ? JSON.stringify(log.details).replace(/"/g, '""') : ''}"`,
    log.ipAddress || '',
    `"${log.userAgent ? log.userAgent.replace(/"/g, '""') : ''}"`,
    log.createdAt.toISOString(),
    log.severity || 'low',
    log.status || 'success'
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.join(','))
    .join('\n');

  // Create temporary file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `audit-logs-${timestamp}.csv`;
  const filepath = path.join(__dirname, '../../temp', filename);

  // Ensure temp directory exists
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  
  // Write file
  await fs.writeFile(filepath, csvContent);

  // Create download URL (in production, you'd use a proper file storage service)
  const downloadUrl = `/api/audit/download/${filename}`;

  res.json({
    success: true,
    data: {
      downloadUrl
    },
    message: 'Audit logs exported successfully'
  });
}));

// GET /api/audit/download/:filename - Download exported file
router.get('/download/:filename', checkPermission('audit:read'), asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(__dirname, '../../temp', filename);

  try {
    await fs.access(filepath);
    res.download(filepath, filename, (err) => {
      if (!err) {
        // Clean up file after download
        fs.unlink(filepath).catch(console.error);
      }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Export file not found'
    });
  }
}));

// DELETE /api/audit/clear - Clear old audit logs
router.delete('/clear', checkPermission('audit:delete'), asyncHandler(async (req, res) => {
  const { olderThan } = req.query;

  let where = {};
  
  if (olderThan) {
    const cutoffDate = new Date();
    const days = parseInt(olderThan.replace('d', ''));
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    where.createdAt = {
      lt: cutoffDate
    };
  }

  const result = await prisma.auditLog.deleteMany({
    where
  });

  res.json({
    success: true,
    data: {
      deletedCount: result.count
    },
    message: `Cleared ${result.count} audit logs`
  });
}));

module.exports = router; 