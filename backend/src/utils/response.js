/**
 * response.js
 * معايير الاستجابة الموحدة للـ API
 */

/**
 * استجابة نجاح
 * @param {Object} res - كائن الاستجابة Express
 * @param {string} message - رسالة النجاح
 * @param {*} data - البيانات
 * @param {number} statusCode - رمز الحالة
 */
const successResponse = (res, message = 'Success', data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * استجابة خطأ
 * @param {Object} res - كائن الاستجابة Express
 * @param {string} message - رسالة الخطأ
 * @param {number} statusCode - رمز الحالة
 * @param {*} errors - تفاصيل الأخطاء
 */
const errorResponse = (res, message = 'Error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * استجابة الصفحة (للتصفح)
 * @param {Object} res - كائن الاستجابة Express
 * @param {Array} data - البيانات
 * @param {Object} pagination - معلومات التصفح
 */
const paginatedResponse = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};
