/**
 * rateLimiter.js
 * تقييد معدل الطلبات
 */

const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/response');

// المحدد العام
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 دقيقة
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, 'Too many requests, please try again later', 429);
  }
});

// محدد صارم لتسجيل الدخول
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات فقط
  skipSuccessfulRequests: true, // لا تحسب المحاولات الناجحة
  handler: (req, res) => {
    return errorResponse(res, 'Too many login attempts, please try again after 15 minutes', 429);
  }
});

// محدد لإرسال الرسائل
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // دقيقة واحدة
  max: 30, // 30 رسالة في الدقيقة
  handler: (req, res) => {
    return errorResponse(res, 'Message rate limit exceeded', 429);
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  messageLimiter
};
