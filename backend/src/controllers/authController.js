/**
 * authController.js
 * التحكم بالمصادقة
 */

const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/response');
const { sendPushNotification } = require('../config/firebase');
const crypto = require('crypto');

/**
 * تسجيل مستخدم جديد
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { phone, username, fullName, password, email } = req.body;

    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({
      $or: [{ phone }, { username }, ...(email ? [{ email }] : [])]
    });

    if (existingUser) {
      if (existingUser.phone === phone) {
        return errorResponse(res, 'Phone number already registered', 400);
      }
      if (existingUser.username === username) {
        return errorResponse(res, 'Username already taken', 400);
      }
      if (email && existingUser.email === email) {
        return errorResponse(res, 'Email already registered', 400);
      }
    }

    // إنشاء مستخدم جديد
    const user = await User.create({
      phone,
      username,
      fullName,
      password,
      email
    });

    // إنشاء التوكن
    const token = generateToken(user._id);

    // إزالة كلمة المرور من الاستجابة
    const userResponse = user.toObject();
    delete userResponse.password;

    return successResponse(res, 'User registered successfully', {
      token,
      user: userResponse
    }, 201);

  } catch (error) {
    console.error('❌ Register error:', error);
    return errorResponse(res, 'Error registering user', 500);
  }
};

/**
 * تسجيل الدخول
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { phone, password, fcmToken, device } = req.body;

    // البحث عن المستخدم
    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // التحقق من كلمة المرور
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // تحديث FCM Token إذا وجد
    if (fcmToken) {
      const tokenExists = user.fcmTokens.some(t => t.token === fcmToken);
      if (!tokenExists) {
        user.fcmTokens.push({
          token: fcmToken,
          device: device || 'unknown'
        });
        await user.save();
      }
    }

    // تحديث الحالة
    user.status = 'online';
    await user.save();

    // إنشاء التوكن
    const token = generateToken(user._id);

    // إزالة كلمة المرور
    const userResponse = user.toObject();
    delete userResponse.password;

    return successResponse(res, 'Login successful', {
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return errorResponse(res, 'Error logging in', 500);
  }
};

/**
 * تسجيل الخروج
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user) {
      user.status = 'offline';
      user.lastSeen = new Date();
      
      // إزالة FCM Token الحالي
      const currentToken = req.body.fcmToken;
      if (currentToken) {
        user.fcmTokens = user.fcmTokens.filter(t => t.token !== currentToken);
      }
      
      await user.save();
    }

    return successResponse(res, 'Logged out successfully');

  } catch (error) {
    console.error('❌ Logout error:', error);
    return errorResponse(res, 'Error logging out', 500);
  }
};

/**
 * الحصول على المستخدم الحالي
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends.user', 'username fullName avatar status');

    return successResponse(res, 'User retrieved successfully', { user });

  } catch (error) {
    console.error('❌ Get me error:', error);
    return errorResponse(res, 'Error retrieving user', 500);
  }
};

/**
 * تحديث الملف الشخصي
 * PUT /api/auth/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, bio, birthday, gender } = req.body;
    
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (birthday) updateData.birthday = birthday;
    if (gender) updateData.gender = gender;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    return successResponse(res, 'Profile updated successfully', { user });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    return errorResponse(res, 'Error updating profile', 500);
  }
};

/**
 * تغيير كلمة المرور
 * PUT /api/auth/password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // التحقق من كلمة المرور الحالية
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    // تحديث كلمة المرور
    user.password = newPassword;
    await user.save();

    return successResponse(res, 'Password changed successfully');

  } catch (error) {
    console.error('❌ Change password error:', error);
    return errorResponse(res, 'Error changing password', 500);
  }
};

/**
 * طلب إعادة تعيين كلمة المرور
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    
    const user = await User.findOne({ phone });
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // إنشاء رمز إعادة التعيين
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 دقيقة

    await user.save();

    // TODO: إرسال SMS بالرمز
    console.log(`Reset token for ${phone}: ${resetToken}`);

    return successResponse(res, 'Password reset code sent');

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    return errorResponse(res, 'Error processing request', 500);
  }
};

/**
 * تحديث FCM Token
 * PUT /api/auth/fcm-token
 */
exports.updateFcmToken = async (req, res) => {
  try {
    const { fcmToken, device } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // إزالة التوكن القديم إذا وجد
    user.fcmTokens = user.fcmTokens.filter(t => t.token !== fcmToken);
    
    // إضافة التوكن الجديد
    user.fcmTokens.push({
      token: fcmToken,
      device: device || 'unknown',
      createdAt: new Date()
    });

    await user.save();

    return successResponse(res, 'FCM token updated');

  } catch (error) {
    console.error('❌ Update FCM token error:', error);
    return errorResponse(res, 'Error updating token', 500);
  }
};
