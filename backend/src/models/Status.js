/**
 * Status.js
 * نموذج الحالات (Stories) - مشابه لـ WhatsApp Status
 */

const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  // صاحب الحالة
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // نوع المحتوى
  type: {
    type: String,
    enum: ['image', 'video', 'text'],
    required: true
  },
  
  // المحتوى
  content: {
    text: String, // للنص
    media: {
      url: String,
      publicId: String,
      thumbnail: String,
      duration: Number // للفيديو
    },
    backgroundColor: String, // للنص
    fontStyle: String
  },
  
  // المشاهدات
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    reaction: {
      type: String,
      enum: ['❤️', '😂', '😮', '🔥', '👏', '']
    }
  }],
  
  // الإعدادات
  settings: {
    canReply: {
      type: Boolean,
      default: true
    },
    canShare: {
      type: Boolean,
      default: true
    },
    hideFrom: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // مدة الظهور (بالساعات)
  duration: {
    type: Number,
    default: 24 // 24 ساعة
  },
  
  // وقت الانتهاء
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    },
    index: true
  },
  
  // إحصائيات
  stats: {
    viewCount: {
      type: Number,
      default: 0
    },
    replyCount: {
      type: Number,
      default: 0
    }
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  }
  
}, {
  timestamps: true
});

// فهارس
statusSchema.index({ user: 1, createdAt: -1 });
statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // حذف تلقائي بعد الانتهاء

// إضافة مشاهدة
statusSchema.methods.addView = function(userId, reaction = '') {
  const alreadyViewed = this.views.some(v => v.user.toString() === userId.toString());
  
  if (!alreadyViewed) {
    this.views.push({
      user: userId,
      reaction
    });
    this.stats.viewCount = this.views.length;
    return this.save();
  }
  
  return this;
};

// الحصول على المشاهدين
statusSchema.methods.getViewers = function() {
  return this.views.map(v => ({
    user: v.user,
    viewedAt: v.viewedAt,
    reaction: v.reaction
  }));
};

const Status = mongoose.model('Status', statusSchema);

module.exports = Status;
