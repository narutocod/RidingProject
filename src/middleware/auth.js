const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');
const config = require('../config/appConfig');

/**
 * Verify JWT token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    const redis = getRedisClient();
    const isBlacklisted = await redis.get(`blacklist_${token}`);

    if (isBlacklisted) {
      return ApiResponse.unauthorized(res, 'Token has been invalidated');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;

    next();
  } catch (error) {
    logger.error('Token verification error:', error);

    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid token');
    }

    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expired');
    }

    return ApiResponse.error(res, 'Token verification failed');
  }
};

/**
 * Check user role
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];

    if (!userRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

module.exports = {
  verifyToken,
  checkRole,
  optionalAuth
};
