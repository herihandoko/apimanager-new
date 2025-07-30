const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    // Check if session is valid
    const session = await prisma.session.findFirst({
      where: {
        userId: user.id,
        token: token,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session expired'
      });
    }

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to authenticate API key
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    // Find API key in database
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        user: {
          include: {
            role: true
          }
        }
      }
    });

    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive API key'
      });
    }

    // Check if API key is expired
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'API key expired'
      });
    }

    // Check IP whitelist if configured
    if (apiKeyRecord.ipWhitelist.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress;
      if (!apiKeyRecord.ipWhitelist.includes(clientIP)) {
        return res.status(403).json({
          success: false,
          message: 'IP address not allowed'
        });
      }
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() }
    });

    req.apiKey = apiKeyRecord;
    req.user = apiKeyRecord.user;
    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'API key authentication error'
    });
  }
};

/**
 * Middleware to check permissions
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No role assigned'
        });
      }

      const permissions = user.role.permissions;
      
      if (!permissions || !permissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Missing permission '${permission}'`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check error'
      });
    }
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user || !user.role || user.role.name !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Admin check error'
    });
  }
};

/**
 * Middleware to check if user is owner or admin
 */
const requireOwnerOrAdmin = (req, res, next) => {
  try {
    const user = req.user;
    const resourceUserId = req.params.userId || req.body.userId;
    
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Authentication required'
      });
    }

    // Admin can access everything
    if (user.role && user.role.name === 'admin') {
      return next();
    }

    // User can only access their own resources
    if (user.id === resourceUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied: You can only access your own resources'
    });
  } catch (error) {
    console.error('Owner or admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access control error'
    });
  }
};

module.exports = {
  authenticateToken,
  authenticateApiKey,
  checkPermission,
  requireAdmin,
  requireOwnerOrAdmin
}; 