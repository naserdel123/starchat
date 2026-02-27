/**
 * Transaction.js
 * نموذج المعاملات المالية (شراء النجوم، الهدايا)
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // المستخدم
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // نوع المعاملة
  type: {
    type: String,
    enum: ['purchase', 'gift_sent', 'gift_received', 'bonus', 'refund', 'withdrawal'],
    required: true
  },
  
  // المبلغ (النجوم)
  amount: {
    type: Number,
    required: true
  },
  
  // الرصيد بعد المعاملة
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // الوصف
  description: {
    type: String,
    required: true
  },
  
  // تفاصيل إضافية
  details: {
    // لشراء النجوم
    purchase: {
      paymentMethod: {
        type: String,
        enum: ['credit_card', 'paypal', 'apple_pay', 'google_pay', 'crypto']
      },
      paymentId: String,
      packageId: String,
      price: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    
    // للهدايا
    gift: {
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      giftType: String,
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
      }
    },
    
    // للمكافآت
    bonus: {
      reason: String,
      event: String
    }
  },
  
  // حالة المعاملة
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  
  // معرف خارجي (من بوابة الدفع)
  externalId: String,
  
  // IP والجهاز
  metadata: {
    ip: String,
    userAgent: String,
    device: String
  }
  
}, {
  timestamps: true
});

// فهارس
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ externalId: 1 }, { sparse: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
