/**
 * User.js
 * نموذج المستخدم
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // معلومات أساسية
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    index: true
  },
  
  email: {
    type: String,
    unique: true,
    sparse: true, // يسمح بقيم null مع الحفاظ على التفرّد
    lowercase: true,
    trim: true
  },
  
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  // الأمان
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // لا يُرجع مع الاستعلامات العادية
  },
  
  // الصورة الشخصية
  avatar: {
    url: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
    },
    publicId: String
  },
  
  // معلومات إضافية
  bio: {
    type: String,
    maxlength: [160, 'Bio cannot exceed 160 characters'],
    default: ''
  },
  
  birthday: {
    type: Date
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  },
  
  // حالة الاتصال
  status: {
    type: String,
    enum: ['online', 'offline', 'busy', 'away'],
    default: 'offline'
  },
  
  lastSeen: {
    type: Date,
    default: Date.now
  },
  
  // FCM Token للإشعارات
  fcmTokens: [{
    token: String,
    device: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // نظام النجوم والنقاط
  stars: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    totalEarned: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    }
  },
  
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // قائمة الأصدقاء
  friends: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // الإعدادات
  settings: {
    notifications: {
      push: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      vibrate: { type: Boolean, default: true },
      preview: { type: Boolean, default: true } // معاينة الرسائل في الإشعارات
    },
    privacy: {
      lastSeen: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
      profilePhoto: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
      readReceipts: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'ar'
    }
  },
  
  // التحقق
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationCode: String,
  verificationCodeExpires: Date,
  
  // إعادة تعيين كلمة المرور
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // إحصائيات
  stats: {
    messagesSent: { type: Number, default: 0 },
    messagesReceived: { type: Number, default: 0 },
    callsMade: { type: Number, default: 0 },
    giftsSent: { type: Number, default: 0 },
    giftsReceived: { type: Number, default: 0 }
  }
  
}, {
  timestamps: true, // createdAt و updatedAt تلقائياً
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// الفهارس لتحسين الأداء
userSchema.index({ username: 'text', fullName: 'text' });
userSchema.index({ status: 1, lastSeen: -1 });
userSchema.index({ 'friends.user': 1 });

// تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12); // 12 rounds for security
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// مقارنة كلمة المرور
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// تحديث lastSeen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save({ validateBeforeSave: false });
};

// إضافة نقاط الخبرة
userSchema.methods.addExperience = function(points) {
  this.points += points;
  
  // حساب المستوى (كل 1000 نقطة = مستوى جديد)
  const newLevel = Math.floor(this.points / 1000) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
  }
  
  return this.save();
};

// شراء نجوم
userSchema.methods.purchaseStars = function(amount) {
  this.stars.balance += amount;
  this.stars.totalEarned += amount;
  return this.save();
};

// إرسال هدية (خصم النجوم)
userSchema.methods.sendGift = function(starsCost) {
  if (this.stars.balance < starsCost) {
    throw new Error('Insufficient stars balance');
  }
  
  this.stars.balance -= starsCost;
  this.stars.totalSpent += starsCost;
  this.stats.giftsSent += 1;
  return this.save();
};

// تلقي هدية
userSchema.methods.receiveGift = function(starsValue) {
  this.stars.balance += starsValue;
  this.stats.giftsReceived += 1;
  return this.save();
};

// الحصول على FCM tokens الفعّالة
userSchema.methods.getActiveFcmTokens = function() {
  // إزالة التوكنات القديمة (أكثر من 3 أشهر)
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  this.fcmTokens = this.fcmTokens.filter(token => token.createdAt > threeMonthsAgo);
  return this.fcmTokens.map(t => t.token);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
