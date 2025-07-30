const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkPermission } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */
router.get('/', checkPermission('role:read'), asyncHandler(async (req, res) => {
  const roles = await prisma.role.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      permissions: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          users: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: roles
  });
}));

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
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
 *         description: Role retrieved successfully
 */
router.get('/:id', checkPermission('role:read'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const role = await prisma.role.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      permissions: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      users: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          isActive: true
        }
      }
    }
  });

  if (!role) {
    return res.status(404).json({
      success: false,
      message: 'Role not found'
    });
  }

  res.json({
    success: true,
    data: role
  });
}));

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
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
 *     responses:
 *       201:
 *         description: Role created successfully
 */
router.post('/', [
  checkPermission('role:create'),
  body('name').trim().notEmpty().isLength({ min: 1, max: 50 }),
  body('description').optional().trim().isLength({ max: 200 }),
  body('permissions').isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { name, description, permissions } = req.body;

  // Check if role already exists
  const existingRole = await prisma.role.findUnique({
    where: { name }
  });

  if (existingRole) {
    return res.status(409).json({
      success: false,
      message: 'Role with this name already exists'
    });
  }

  // Create role
  const role = await prisma.role.create({
    data: {
      name,
      description,
      permissions
    },
    select: {
      id: true,
      name: true,
      description: true,
      permissions: true,
      isActive: true,
      createdAt: true
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'CREATE',
      resource: 'Role',
      resourceId: role.id,
      details: { name, description, permissions },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json({
    success: true,
    message: 'Role created successfully',
    data: role
  });
}));

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
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
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Role updated successfully
 */
router.put('/:id', [
  checkPermission('role:update'),
  body('name').optional().trim().isLength({ min: 1, max: 50 }),
  body('description').optional().trim().isLength({ max: 200 }),
  body('permissions').optional().isArray(),
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

  // Check if role exists
  const existingRole = await prisma.role.findUnique({
    where: { id }
  });

  if (!existingRole) {
    return res.status(404).json({
      success: false,
      message: 'Role not found'
    });
  }

  // Prevent updating system roles
  if (['admin', 'user', 'moderator'].includes(existingRole.name)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update system roles'
    });
  }

  // Check if new name conflicts with existing role
  if (updateData.name && updateData.name !== existingRole.name) {
    const nameConflict = await prisma.role.findUnique({
      where: { name: updateData.name }
    });

    if (nameConflict) {
      return res.status(409).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }
  }

  // Update role
  const updatedRole = await prisma.role.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      description: true,
      permissions: true,
      isActive: true,
      updatedAt: true
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'Role',
      resourceId: id,
      details: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    message: 'Role updated successfully',
    data: updatedRole
  });
}));

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
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
 *         description: Role deleted successfully
 */
router.delete('/:id', checkPermission('role:delete'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if role exists
  const existingRole = await prisma.role.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true
        }
      }
    }
  });

  if (!existingRole) {
    return res.status(404).json({
      success: false,
      message: 'Role not found'
    });
  }

  // Prevent deleting system roles
  if (['admin', 'user', 'moderator'].includes(existingRole.name)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete system roles'
    });
  }

  // Check if role has users
  if (existingRole._count.users > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete role with assigned users'
    });
  }

  // Delete role
  await prisma.role.delete({
    where: { id }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'DELETE',
      resource: 'Role',
      resourceId: id,
      details: { name: existingRole.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    message: 'Role deleted successfully'
  });
}));

/**
 * @swagger
 * /api/roles/permissions:
 *   get:
 *     summary: Get available permissions
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 */
router.get('/permissions', asyncHandler(async (req, res) => {
  const permissions = [
    // User permissions
    { name: 'user:read', description: 'View users' },
    { name: 'user:create', description: 'Create users' },
    { name: 'user:update', description: 'Update users' },
    { name: 'user:delete', description: 'Delete users' },
    
    // Role permissions
    { name: 'role:read', description: 'View roles' },
    { name: 'role:create', description: 'Create roles' },
    { name: 'role:update', description: 'Update roles' },
    { name: 'role:delete', description: 'Delete roles' },
    
    // API Key permissions
    { name: 'apikey:read', description: 'View API keys' },
    { name: 'apikey:create', description: 'Create API keys' },
    { name: 'apikey:update', description: 'Update API keys' },
    { name: 'apikey:delete', description: 'Delete API keys' },
    
    // Audit permissions
    { name: 'audit:read', description: 'View audit logs' },
    
    // System permissions
    { name: 'system:read', description: 'View system settings' },
    { name: 'system:update', description: 'Update system settings' }
  ];

  res.json({
    success: true,
    data: permissions
  });
}));

module.exports = router; 