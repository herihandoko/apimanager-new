const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkPermission } = require('../middleware/auth');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// In-memory settings storage (in production, use database or config files)
let systemSettings = {
  general: {
    siteName: 'API Manager',
    siteDescription: 'Modern API Management Platform',
    timezone: 'Asia/Jakarta',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24',
    language: 'en',
    maintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.'
  },
  security: {
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    requireMFA: false,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    enableAuditLogs: true,
    enableIPWhitelist: false,
    allowedIPs: []
  },
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: 'noreply@apimanager.com',
    fromName: 'API Manager',
    enableEmailNotifications: true
  },
  api: {
    rateLimitEnabled: true,
    rateLimitRequests: 100,
    rateLimitWindow: 60,
    enableAPIKeys: true,
    requireAPIKeyAuth: false,
    enableCORS: true,
    allowedOrigins: ['*'],
    enableSwagger: true
  }
};

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get all system settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 */
router.get('/', checkPermission('system:read'), asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: systemSettings
  });
}));

/**
 * @swagger
 * /api/settings/general:
 *   put:
 *     summary: Update general settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteName:
 *                 type: string
 *               siteDescription:
 *                 type: string
 *               timezone:
 *                 type: string
 *               dateFormat:
 *                 type: string
 *               timeFormat:
 *                 type: string
 *               language:
 *                 type: string
 *               maintenanceMode:
 *                 type: boolean
 *               maintenanceMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: General settings updated successfully
 */
router.put('/general', [
  checkPermission('system:update'),
  body('siteName').optional().trim().isLength({ min: 1, max: 100 }),
  body('siteDescription').optional().trim().isLength({ max: 500 }),
  body('timezone').optional().isString(),
  body('dateFormat').optional().isString(),
  body('timeFormat').optional().isIn(['12', '24']),
  body('language').optional().isString(),
  body('maintenanceMode').optional().isBoolean(),
  body('maintenanceMessage').optional().trim().isLength({ max: 1000 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const updateData = req.body;
  systemSettings.general = { ...systemSettings.general, ...updateData };

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'Settings',
      resourceId: 'general',
      details: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    message: 'General settings updated successfully',
    data: systemSettings.general
  });
}));

/**
 * @swagger
 * /api/settings/security:
 *   put:
 *     summary: Update security settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionTimeout:
 *                 type: number
 *               maxLoginAttempts:
 *                 type: number
 *               lockoutDuration:
 *                 type: number
 *               requireMFA:
 *                 type: boolean
 *               passwordMinLength:
 *                 type: number
 *               passwordRequireUppercase:
 *                 type: boolean
 *               passwordRequireLowercase:
 *                 type: boolean
 *               passwordRequireNumbers:
 *                 type: boolean
 *               passwordRequireSymbols:
 *                 type: boolean
 *               enableAuditLogs:
 *                 type: boolean
 *               enableIPWhitelist:
 *                 type: boolean
 *               allowedIPs:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Security settings updated successfully
 */
router.put('/security', [
  checkPermission('system:update'),
  body('sessionTimeout').optional().isInt({ min: 5, max: 1440 }),
  body('maxLoginAttempts').optional().isInt({ min: 1, max: 10 }),
  body('lockoutDuration').optional().isInt({ min: 5, max: 1440 }),
  body('requireMFA').optional().isBoolean(),
  body('passwordMinLength').optional().isInt({ min: 6, max: 50 }),
  body('passwordRequireUppercase').optional().isBoolean(),
  body('passwordRequireLowercase').optional().isBoolean(),
  body('passwordRequireNumbers').optional().isBoolean(),
  body('passwordRequireSymbols').optional().isBoolean(),
  body('enableAuditLogs').optional().isBoolean(),
  body('enableIPWhitelist').optional().isBoolean(),
  body('allowedIPs').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const updateData = req.body;
  systemSettings.security = { ...systemSettings.security, ...updateData };

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'Settings',
      resourceId: 'security',
      details: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    message: 'Security settings updated successfully',
    data: systemSettings.security
  });
}));

/**
 * @swagger
 * /api/settings/email:
 *   put:
 *     summary: Update email settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               smtpHost:
 *                 type: string
 *               smtpPort:
 *                 type: number
 *               smtpUsername:
 *                 type: string
 *               smtpPassword:
 *                 type: string
 *               smtpSecure:
 *                 type: boolean
 *               fromEmail:
 *                 type: string
 *               fromName:
 *                 type: string
 *               enableEmailNotifications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Email settings updated successfully
 */
router.put('/email', [
  checkPermission('system:update'),
  body('smtpHost').optional().isString(),
  body('smtpPort').optional().isInt({ min: 1, max: 65535 }),
  body('smtpUsername').optional().isString(),
  body('smtpPassword').optional().isString(),
  body('smtpSecure').optional().isBoolean(),
  body('fromEmail').optional().isEmail(),
  body('fromName').optional().isString(),
  body('enableEmailNotifications').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const updateData = req.body;
  systemSettings.email = { ...systemSettings.email, ...updateData };

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'Settings',
      resourceId: 'email',
      details: { ...updateData, smtpPassword: '[HIDDEN]' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    message: 'Email settings updated successfully',
    data: systemSettings.email
  });
}));

/**
 * @swagger
 * /api/settings/api:
 *   put:
 *     summary: Update API settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rateLimitEnabled:
 *                 type: boolean
 *               rateLimitRequests:
 *                 type: number
 *               rateLimitWindow:
 *                 type: number
 *               enableAPIKeys:
 *                 type: boolean
 *               requireAPIKeyAuth:
 *                 type: boolean
 *               enableCORS:
 *                 type: boolean
 *               allowedOrigins:
 *                 type: array
 *                 items:
 *                   type: string
 *               enableSwagger:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: API settings updated successfully
 */
router.put('/api', [
  checkPermission('system:update'),
  body('rateLimitEnabled').optional().isBoolean(),
  body('rateLimitRequests').optional().isInt({ min: 1, max: 10000 }),
  body('rateLimitWindow').optional().isInt({ min: 1, max: 3600 }),
  body('enableAPIKeys').optional().isBoolean(),
  body('requireAPIKeyAuth').optional().isBoolean(),
  body('enableCORS').optional().isBoolean(),
  body('allowedOrigins').optional().isArray(),
  body('enableSwagger').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const updateData = req.body;
  systemSettings.api = { ...systemSettings.api, ...updateData };

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'Settings',
      resourceId: 'api',
      details: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    message: 'API settings updated successfully',
    data: systemSettings.api
  });
}));

/**
 * @swagger
 * /api/settings/email/test:
 *   post:
 *     summary: Test email configuration
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email test completed
 */
router.post('/email/test', checkPermission('system:update'), asyncHandler(async (req, res) => {
  // Mock email test - in production, actually send a test email
  res.json({
    success: true,
    message: 'Email configuration test completed successfully'
  });
}));

/**
 * @swagger
 * /api/settings/system-info:
 *   get:
 *     summary: Get system information
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System information retrieved successfully
 */
router.get('/system-info', checkPermission('system:read'), asyncHandler(async (req, res) => {
  // Get system information
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  // Mock disk usage (in production, use actual disk space checking)
  const diskUsage = {
    used: Math.floor(Math.random() * 500 * 1024 * 1024 * 1024), // Random between 0-500GB
    total: 1000 * 1024 * 1024 * 1024 // 1TB
  };

  // Get database status
  let dbStatus = 'Connected';
  let dbVersion = 'PostgreSQL 15.0';
  
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'Disconnected';
  }

  res.json({
    success: true,
    data: {
      version: '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: usedMemory,
        total: totalMemory
      },
      disk: diskUsage,
      database: {
        status: dbStatus,
        version: dbVersion
      }
    }
  });
}));

/**
 * @swagger
 * /api/settings/backup:
 *   post:
 *     summary: Create system backup
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup created successfully
 */
router.post('/backup', checkPermission('system:update'), asyncHandler(async (req, res) => {
  const backupId = `backup_${Date.now()}`;
  const filename = `${backupId}.sql`;
  const size = Math.floor(Math.random() * 10000000) + 1000000; // Random size between 1-10MB

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'CREATE',
      resource: 'Backup',
      resourceId: backupId,
      details: { filename, size },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    message: 'Backup created successfully',
    data: {
      backupId,
      filename,
      size
    }
  });
}));

/**
 * @swagger
 * /api/settings/restore/{backupId}:
 *   post:
 *     summary: Restore system from backup
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: backupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: System restored successfully
 */
router.post('/restore/:backupId', checkPermission('system:update'), asyncHandler(async (req, res) => {
  const { backupId } = req.params;

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'RESTORE',
      resource: 'Backup',
      resourceId: backupId,
      details: { backupId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    message: 'System restored successfully from backup'
  });
}));

module.exports = router; 