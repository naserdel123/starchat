/**
 * helpers.js
 * دوال مساعدة عامة
 */

const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

/**
 * إنشاء معرف فريد
 * @returns {string} UUID
 */
const generateUUID = () => {
  return uuidv4();
};

/**
 * تنسيق التاريخ
 * @param {Date} date - التاريخ
 * @param {string} format - التنسيق المطلوب
 * @returns {string} التاريخ المنسق
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).format(format);
};

/**
 * الحصول على الوقت النسبي (منذ ...)
 * @param {Date} date - التاريخ
 * @returns {string} الوقت النسبي
 */
const getRelativeTime = (date) => {
  return moment(date).fromNow();
};

/**
 * إنشاء كود عشوائي
 * @param {number} length - طول الكود
 * @returns {string} الكود العشوائي
 */
const generateRandomCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * إخفاء جزء من النص (مثل البريد الإلكتروني)
 * @param {string} text - النص الأصلي
 * @param {number} visibleStart - عدد الأحرف المرئية من البداية
 * @param {number} visibleEnd - عدد الأحرف المرئية من النهاية
 * @returns {string} النص المخفي
 */
const maskText = (text, visibleStart = 2, visibleEnd = 2) => {
  if (text.length <= visibleStart + visibleEnd) return text;
  
  const start = text.substring(0, visibleStart);
  const end = text.substring(text.length - visibleEnd);
  const masked = '*'.repeat(text.length - visibleStart - visibleEnd);
  
  return `${start}${masked}${end}`;
};

/**
 * تقسيم مصفوفة إلى مجموعات
 * @param {Array} array - المصفوفة الأصلية
 * @param {number} size - حكل مجموعة
 * @returns {Array} المصفوفة المقسمة
 */
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * إزالة الخصائص الفارغة من كائن
 * @param {Object} obj - الكائن
 * @returns {Object} الكائن بدون خصائص فارغة
 */
const removeEmptyProperties = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null && v !== '')
  );
};

/**
 * تحويل بايت إلى حجم مقروء
 * @param {number} bytes - عدد البايت
 * @param {number} decimals - عدد الكسور العشرية
 * @returns {string} الحجم المقروء
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * التحقق من صحة رقم الهاتف
 * @param {string} phone - رقم الهاتف
 * @returns {boolean} صحة الرقم
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

/**
 * إنشاء slug من نص
 * @param {string} text - النص
 * @returns {string} الـ slug
 */
const createSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * تأخير (Delay) وهمي
 * @param {number} ms - المدة بالمللي ثانية
 * @returns {Promise} وعد بالانتظار
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * محاولة تنفيذ دالة مع إعادة المحاولة
 * @param {Function} fn - الدالة المراد تنفيذها
 * @param {number} retries - عدد محاولات إعادة المحاولة
 * @param {number} delay - التأخير بين المحاولات
 * @returns {Promise} نتيجة الدالة
 */
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    console.log(`Retrying... ${retries} attempts left`);
    await sleep(delay);
    return retry(fn, retries - 1, delay);
  }
};

module.exports = {
  generateUUID,
  formatDate,
  getRelativeTime,
  generateRandomCode,
  maskText,
  chunkArray,
  removeEmptyProperties,
  formatBytes,
  isValidPhone,
  createSlug,
  sleep,
  retry
};
