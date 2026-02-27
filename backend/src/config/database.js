/**
 * database.js
 * إعدادات الاتصال بقاعدة بيانات MongoDB باستخدام Mongoose
 */

const mongoose = require('mongoose');

/**
 * الاتصال بقاعدة البيانات
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // إعدادات Mongoose الموصى بها للإصدارات الحديثة
      maxPoolSize: 10, // عدد الاتصالات المتزامنة
      serverSelectionTimeoutMS: 5000, // مهلة اختيار السيرفر
      socketTimeoutMS: 45000, // مهلة المقبس
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // معالجة أخطاء الاتصال بعد الاتصال الأولي
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // الخروج من العملية في حالة فشل الاتصال
    process.exit(1);
  }
};

module.exports = connectDB;
