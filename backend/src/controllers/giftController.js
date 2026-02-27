/**
 * giftController.js
 * التحكم بالهدايا والنجوم
 */

const User = require('../models/User');
const Message = require('../models/Message');
const Transaction = require('../models/Transaction');
const { successResponse, errorResponse } = require('../utils/response');

// أسعار الهدايا (بالنجوم)
const GIFT_PRICES = {
  rose: { stars: 10, animation: 'rose_animation' },
  teddy: { stars: 50, animation: 'teddy_animation' },
  diamond: { stars: 100, animation: 'diamond_animation' },
  crown: { stars: 500, animation: 'crown_animation' },
  star: { stars: 1000, animation: 'star_animation' }
};

/**
 * شراء نجوم (محاكاة)
 * POST /api/gifts/purchase
 */
exports.purchaseStars = async (req, res) => {
  try {
    const { packageId, paymentMethod } = req.body;

    // حزم النجوم المتاحة
    const packages = {
      'small': { stars: 100, price: 0.99 },
      'medium': { stars: 500, price: 4.99 },
      'large': { stars: 1000, price: 9.99 },
      'xlarge': { stars: 5000, price: 49.99 }
    };

    const pkg = packages[packageId];
    if (!pkg) {
      return errorResponse(res, 'Invalid package', 400);
    }

    const user = await User.findById(req.user.id);

    // محاكاة عملية الشراء (في الإنتاج: ربط مع Stripe/PayPal)
    // TODO: تكامل مع بوابة دفع حقيقية

    // إضافة النجوم
    await user.purchaseStars(pkg.stars);

    // تسجيل المعاملة
    await Transaction.create({
      user: req.user.id,
      type: 'purchase',
      amount: pkg.stars,
      balanceAfter: user.stars.balance,
      description: `Purchased ${pkg.stars} stars`,
      details: {
        purchase: {
          paymentMethod,
          packageId,
          price: pkg.price,
          currency: 'USD'
        }
      },
      status: 'completed'
    });

    return successResponse(res, 'Stars purchased successfully', {
      stars: user.stars,
      transaction: {
        amount: pkg.stars,
        price: pkg.price
      }
    });

  } catch (error) {
    console.error('❌ Purchase stars error:', error);
    return errorResponse(res, 'Error purchasing stars', 500);
  }
};

/**
 * إرسال هدية
 * POST /api/gifts/send
 */
exports.sendGift = async (req, res) => {
  try {
    const { receiverId, giftType, message } = req.body;

    const giftInfo = GIFT_PRICES[giftType];
    if (!giftInfo) {
      return errorResponse(res, 'Invalid gift type', 400);
    }

    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return errorResponse(res, 'Receiver not found', 404);
    }

    // التحقق من الرصيد
    if (sender.stars.balance < giftInfo.stars) {
      return errorResponse(res, 'Insufficient stars balance', 400);
    }

    // خصم من المرسل
    await sender.sendGift(giftInfo.stars);

    // إضافة للمستقبل (80% من القيمة)
    const receiverValue = Math.floor(giftInfo.stars * 0.8);
    await receiver.receiveGift(receiverValue);

    // إنشاء رسالة الهدية
    const giftMessage = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      messageType: 'gift',
      gift: {
        type: giftType,
        starsValue: giftInfo.stars,
        animation: giftInfo.animation
      }
    });

    // تسجيل المعاملة للمرسل
    await Transaction.create({
      user: req.user.id,
      type: 'gift_sent',
      amount: -giftInfo.stars,
      balanceAfter: sender.stars.balance,
      description: `Sent ${giftType} gift to ${receiver.username}`,
      details: {
        gift: {
          recipient: receiverId,
          giftType,
          messageId: giftMessage._id
        }
      }
    });

    // تسجيل المعاملة للمستقبل
    await Transaction.create({
      user: receiverId,
      type: 'gift_received',
      amount: receiverValue,
      balanceAfter: receiver.stars.balance,
      description: `Received ${giftType} gift from ${sender.username}`,
      details: {
        gift: {
          sender: req.user.id,
          giftType
        }
      }
    });

    // إشعار المستقبل
    req.app.get('io').to(receiverId).emit('gift_received', {
      from: req.user.id,
      giftType,
      messageId: giftMessage._id
    });

    // إشعار FCM
    const fcmTokens = receiver.getActiveFcmTokens();
    if (fcmTokens.length > 0) {
      await sendPushNotification(
        fcmTokens[0],
        {
          title: '🎁 New Gift!',
          body: `${sender.fullName} sent you a ${giftType}`
        },
        {
          type: 'gift_received',
          messageId: giftMessage._id
        }
      );
    }

    return successResponse(res, 'Gift sent successfully', {
      giftMessage,
      remainingStars: sender.stars.balance
    });

  } catch (error) {
    console.error('❌ Send gift error:', error);
    return errorResponse(res, error.message || 'Error sending gift', 500);
  }
};

/**
 * الحصول على رصيد النجوم
 * GET /api/gifts/balance
 */
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    return successResponse(res, 'Balance retrieved', {
      stars: user.stars,
      points: user.points,
      level: user.level
    });

  } catch (error) {
    console.error('❌ Get balance error:', error);
    return errorResponse(res, 'Error retrieving balance', 500);
  }
};

/**
 * الحصول على تاريخ المعاملات
 * GET /api/gifts/transactions
 */
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const query = { user: req.user.id };
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    return successResponse(res, 'Transactions retrieved', {
      transactions,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('❌ Get transactions error:', error);
    return errorResponse(res, 'Error retrieving transactions', 500);
  }
};
