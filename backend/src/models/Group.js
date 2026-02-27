/**
 * Group.js
 * نموذج المجموعات
 */

const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  // معلومات أساسية
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // الصورة
  avatar: {
    url: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
    },
    publicId: String
  },
  
  // المالك والمشرفون
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  admins: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // الأعضاء
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'owner'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    muteExpiresAt: Date
  }],
  
  // الإعدادات
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    onlyAdminsCanPost: {
      type: Boolean,
      default: false
    },
    onlyAdminsCanAddMembers: {
      type: Boolean,
      default: true
    },
    approvalRequired: {
      type: Boolean,
      default: false // يتطلب موافقة المشرف على الانضمام
    }
  },
  
  // طلبات الانضمام
  joinRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // الرسائل المثبتة
  pinnedMessages: [{
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pinnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // الرابط الدعوة
  inviteLink: {
    code: {
      type: String,
      unique: true,
      sparse: true
    },
    expiresAt: Date,
    isRevoked: {
      type: Boolean,
      default: false
    }
  },
  
  // الإحصائيات
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    activeToday: {
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
groupSchema.index({ name: 'text', description: 'text' });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ inviteLink.code: 1 });

// التحقق من عضوية المستخدم
groupSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString()
  );
};

// التحقق من كونه مشرفاً
groupSchema.methods.isAdmin = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && 
    (member.role === 'admin' || member.role === 'owner')
  );
};

// التحقق من كونه مالكاً
groupSchema.methods.isOwner = function(userId) {
  return this.owner.toString() === userId.toString();
};

// إضافة عضو
groupSchema.methods.addMember = function(userId, addedBy, role = 'member') {
  if (this.isMember(userId)) {
    throw new Error('User is already a member');
  }
  
  this.members.push({
    user: userId,
    role,
    addedBy
  });
  
  return this.save();
};

// إزالة عضو
groupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
  return this.save();
};

// ترقية إلى مشرف
groupSchema.methods.promoteToAdmin = function(userId, promotedBy) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) throw new Error('User is not a member');
  
  member.role = 'admin';
  this.admins.push({
    user: userId,
    addedBy: promotedBy
  });
  
  return this.save();
};

// إنشاء رابط دعوة
groupSchema.methods.createInviteLink = function() {
  const crypto = require('crypto');
  const code = crypto.randomBytes(8).toString('hex');
  
  this.inviteLink = {
    code,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 أيام
    isRevoked: false
  };
  
  return this.save();
};

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
