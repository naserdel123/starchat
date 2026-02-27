/**
 * Message.js
 * نموذج الرسائل
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // المرسل والمستقبل
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // محتوى الرسالة
  content: {
    type: String,
    required: function() {
      return this.messageType === 'text';
    }
  },
  
  // نوع الرسالة
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'gift', 'system'],
    default: 'text'
  },
  
  // بيانات الوسائط
  media: {
    url: String,
    publicId: String,
    thumbnail: String, // للفيديو والصور
    duration: Number, // للفيديو والصوت بالثواني
    fileName: String,
    fileSize: Number,
    mimeType: String
  },
  
  // الموقع الجغرافي
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  
  // جهة اتصال مشتركة
  contact: {
    name: String,
    phone: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // هدية
  gift: {
    type: {
      type: String,
      enum: ['rose', 'teddy', 'diamond', 'crown', 'star']
    },
    starsValue: Number,
    animation: String
  },
  
  // حالة القراءة
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  readAt: {
    type: Date
  },
  
  deliveredAt: {
    type: Date
  },
  
  // الرد على رسالة
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // إعادة توجيه
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // ردود الفعل (Reactions)
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // حذف الرسالة
  deletedFor: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  isDeletedForEveryone: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date
  },
  
  // تعديل الرسالة
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editedAt: {
    type: Date
  },
  
  // تشفير
  isEncrypted: {
    type: Boolean,
    default: true
  },
  
  encryptionVersion: {
    type: String,
    default: '1.0'
  }
  
}, {
  timestamps: true
});

// فهارس مركبة للمحادثات
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, status: 1 });

// الحصول على المحادثة بين مستخدمين
messageSchema.statics.getConversation = async function(userId1, userId2, options = {}) {
  const { limit = 50, before } = options;
  
  const query = {
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 }
    ],
    isDeletedForEveryone: false,
    'deletedFor.user': { $ne: userId1 }
  };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  return this.find(query)
    .populate('sender', 'username fullName avatar')
    .populate('replyTo', 'content messageType sender')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// تحديث حالة القراءة
messageSchema.statics.markAsRead = async function(messageIds, userId) {
  return this.updateMany(
    {
      _id: { $in: messageIds },
      receiver: userId,
      status: { $ne: 'read' }
    },
    {
      $set: {
        status: 'read',
        readAt: new Date()
      }
    }
  );
};

// الحصول على عدد الرسائل غير المقروءة
messageSchema.statics.getUnreadCount = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        receiver: new mongoose.Types.ObjectId(userId),
        status: { $in: ['sent', 'delivered'] },
        isDeletedForEveryone: false
      }
    },
    {
      $group: {
        _id: '$sender',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
