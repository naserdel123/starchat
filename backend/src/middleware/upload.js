/**
 * upload.js
 * وسطي رفع الملفات
 */

const multer = require('multer');
const path = require('path');
const { errorResponse } = require('../utils/response');

// التخزين المحلي (للنسخ الاحتياطي)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// فلترة الملفات
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  };
};

// إعدادات رفع الصور
const uploadImage = multer({
  storage: localStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter(/jpeg|jpg|png|gif|webp/)
});

// إعدادات رفع الفيديو
const uploadVideo = multer({
  storage: localStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB
  },
  fileFilter: fileFilter(/mp4|mov|avi|mkv/)
});

// إعدادات رفع الصوت
const uploadAudio = multer({
  storage: localStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter(/mp3|wav|ogg|m4a/)
});

// إعدادات رفع الملفات العامة
const uploadFile = multer({
  storage: localStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024
  }
});

// معالجة أخطاء Multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'File too large', 400);
    }
    return errorResponse(res, err.message, 400);
  }
  
  if (err) {
    return errorResponse(res, err.message, 400);
  }
  
  next();
};

module.exports = {
  uploadImage,
  uploadVideo,
  uploadAudio,
  uploadFile,
  handleUploadError
};
