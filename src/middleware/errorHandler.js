const logger = require('../utils/logger');
const ApiResponse = require('../utils/response');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    return ApiResponse.notFound(res, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return ApiResponse.error(res, message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    return ApiResponse.validationError(res, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token expired');
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }));
    return ApiResponse.validationError(res, errors);
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path;
    const message = `${field} already exists`;
    return ApiResponse.error(res, message, 400);
  }

  // Default server error
  ApiResponse.error(
    res,
    err.message || 'Internal Server Error',
    err.statusCode || 500
  );
};

/**
 * 404 handler
 */
const notFound = (req, res, next) => {
  ApiResponse.notFound(res, `Route ${req.originalUrl} not found`);
};

module.exports = {
  errorHandler,
  notFound
};
