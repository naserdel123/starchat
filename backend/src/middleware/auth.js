/**
 * auth.js
 * وسطي المصادقة JWT
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');

/**
 * التحقق من التوكن وحماية المسارات
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // التحقق من وجود التوكن في الهيدر
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // أو في الكوكيز
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return errorResponse(res, 'Not authorized to access this route', 401);
    }

    try {
      // التحقق من صحة التوكن
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // الحصول على المستخدم
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return errorResponse(res, 'User not found', 401);
      }

      // التحقق من أن الحسوب غير محذوف أو محظور
      if (user.isDeleted) {
        return errorResponse(res, 'This account has been deactivated', 401);
      }

      // إضافة المستخدم للطلب
      req.user = user;
      next();
      
    } catch (error) {
      return errorResponse(res, 'Not authorized to access this route', 401);
    }
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

/**
 * اختياري - للمسارات التي تعمل مع أو بدون تسجيل دخول
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user && !user.isDeleted) {
          req.user = user;
        }
      } catch (error) {
        // تجاهل الخطأ - المستخدم غير مسجل
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * التحقق من الأدوار
 * @param  {...String} roles - الأدوار المسموحة
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Not authorized', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Not authorized for this action', 403);
    }

    next();
  };
};

/**
 * توليد JWT Token
 * @param {String} id - معرف المستخدم
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  generateToken
};
