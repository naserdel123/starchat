/**
 * errorHandler.js
 * معالج الأخطاء العام
 */

const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('❌ Error:', err);

  // Mongoose - Bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    return errorResponse(res, message, 404);
  }

  // Mongoose - Duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    return errorResponse(res, message, 400);
  }

  // Mongoose - Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return errorResponse(res, 'Validation Error', 400, messages);
  }

  // JWT - Invalid Token
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401);
  }

  // JWT - Expired Token
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401);
  }

  // Default
  return errorResponse(
    res,
    error.message || 'Server Error',
    err.statusCode || 500
  );
};

module.exports = errorHandler;
