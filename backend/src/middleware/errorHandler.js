const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const config = require('../config');

const errorHandler = (err, req, res, _next) => {
  let error = { ...err, message: err.message };

  // Mongoose CastError
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    error = ApiError.badRequest(`Duplicate value for field: ${field}`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = ApiError.badRequest('Validation failed', messages);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired');
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    status: error.status || 'error',
    message: error.message || 'Internal server error',
  };

  if (error.details) {
    response.details = error.details;
  }

  if (config.env === 'development') {
    response.stack = err.stack;
  }

  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${error.message}`, { stack: err.stack, url: req.originalUrl });
  } else {
    logger.warn(`${statusCode} - ${error.message}`, { url: req.originalUrl });
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
