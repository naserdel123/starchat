/**
 * encryption.js
 * أدوات تشفير الرسائل باستخدام AES
 */

const CryptoJS = require('crypto-js');

/**
 * تشفير نص
 * @param {string} text - النص المراد تشفيره
 * @returns {string} النص المشفر
 */
const encryptMessage = (text) => {
  try {
    const key = process.env.ENCRYPTION_KEY;
    const encrypted = CryptoJS.AES.encrypt(text, key, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7,
      iv: CryptoJS.lib.WordArray.random(16)
    });
    return encrypted.toString();
  } catch (error) {
    console.error('❌ Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

/**
 * فك تشفير نص
 * @param {string} encryptedText - النص المشفر
 * @returns {string} النص الأصلي
 */
const decryptMessage = (encryptedText) => {
  try {
    const key = process.env.ENCRYPTION_KEY;
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('❌ Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
};

/**
 * تشفير كائن (Object)
 * @param {Object} obj - الكائن المراد تشفيره
 * @returns {string} النص المشفر
 */
const encryptObject = (obj) => {
  return encryptMessage(JSON.stringify(obj));
};

/**
 * فك تشفير كائن
 * @param {string} encryptedText - النص المشفر
 * @returns {Object} الكائن الأصلي
 */
const decryptObject = (encryptedText) => {
  const decrypted = decryptMessage(encryptedText);
  return JSON.parse(decrypted);
};

/**
 * إنشاء مفتاح تشفير عشوائي
 * @returns {string} مفتاح التشفير
 */
const generateEncryptionKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

/**
 * تشفير بيانات حساسة (مثل رقم الهاتف)
 * @param {string} data - البيانات المراد تشفيرها
 * @returns {string} البيانات المشفرة
 */
const encryptSensitiveData = (data) => {
  const key = process.env.ENCRYPTION_KEY;
  return CryptoJS.HmacSHA256(data, key).toString();
};

module.exports = {
  encryptMessage,
  decryptMessage,
  encryptObject,
  decryptObject,
  generateEncryptionKey,
  encryptSensitiveData
};
