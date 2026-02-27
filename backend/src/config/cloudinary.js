/**
 * cloudinary.js
 * إعدادات Cloudinary لرفع الصور والفيديو
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

/**
 * تهيئة Cloudinary
 */
const initializeCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });

  console.log('✅ Cloudinary configured');
  return cloudinary;
};

/**
 * إعدادات التخزين للصور الشخصية
 */
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'starchat/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' }
    ],
    public_id: (req, file) => `profile_${req.user.id}_${Date.now()}`
  }
});

/**
 * إعدادات التخزين للصور في الدردشة
 */
const chatImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'starchat/chat_images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1920, crop: 'limit' },
      { quality: 'auto:good' }
    ],
    public_id: (req, file) => `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }
});

/**
 * إعدادات التخزين للفيديو
 */
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'starchat/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
    transformation: [
      { width: 1280, crop: 'limit' },
      { quality: 'auto:good' }
    ],
    public_id: (req, file) => `video_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }
});

/**
 * إعدادات التخزين للملفات الصوتية
 */
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'starchat/audio',
    resource_type: 'video', // Cloudinary treats audio as video resource
    allowed_formats: ['mp3', 'wav', 'ogg', 'm4a'],
    public_id: (req, file) => `audio_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }
});

/**
 * حذف ملف من Cloudinary
 * @param {string} publicId - معرف الملف
 * @param {string} resourceType - نوع الملف (image, video, raw)
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log('✅ File deleted from Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  initializeCloudinary,
  profilePictureStorage,
  chatImageStorage,
  videoStorage,
  audioStorage,
  deleteFromCloudinary,
  cloudinary
};
