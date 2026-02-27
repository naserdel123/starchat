/**
 * userController.js
 * التحكم بالمستخدمين والأصدقاء
 */

const User = require('../models/User');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

/**
 * البحث عن مستخدمين
 * GET /api/users/search?q=query
 */
exports.searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.length < 2) {
      return errorResponse(res, 'Search query must be at least 2 characters', 400);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { fullName: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } }
          ]
        },
        { _id: { $ne: req.user.id } } // استبعاد المستخدم الحالي
      ]
    })
      .select('username fullName avatar bio status lastSeen')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({
      $and: [
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { fullName: { $regex: q, $options: 'i' } }
          ]
        },
        { _id: { $ne: req.user.id } }
      ]
    });

    return paginatedResponse(res, users, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    });

  } catch (error) {
    console.error('❌ Search users error:', error);
    return errorResponse(res, 'Error searching users', 500);
  }
};

/**
 * الحصول على ملف مستخدم
 * GET /api/users/:id
 */
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('username fullName avatar bio status lastSeen createdAt stats');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // التحقق من علاقة الصداقة
    const currentUser = await User.findById(req.user.id);
    const isFriend = currentUser.friends.some(f => 
      f.user.toString() === id && f.status === 'accepted'
    );

    return successResponse(res, 'User profile retrieved', {
      user,
      isFriend,
      isBlocked: currentUser.blockedUsers.includes(id)
    });

  } catch (error) {
    console.error('❌ Get user profile error:', error);
    return errorResponse(res, 'Error retrieving user profile', 500);
  }
};

/**
 * إرسال طلب صداقة
 * POST /api/users/friends/request
 */
exports.sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;

    if (userId === req.user.id) {
      return errorResponse(res, 'Cannot add yourself', 400);
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return errorResponse(res, 'User not found', 404);
    }

    const currentUser = await User.findById(req.user.id);

    // التحقق من عدم وجود طلب سابق
    const existingRequest = currentUser.friends.find(f => 
      f.user.toString() === userId
    );

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return errorResponse(res, 'Already friends', 400);
      }
      if (existingRequest.status === 'pending') {
        return errorResponse(res, 'Friend request already sent', 400);
      }
    }

    // إضافة طلب الصداقة
    currentUser.friends.push({
      user: userId,
      status: 'pending'
    });

    await currentUser.save();

    // إضافة للمستخدم الآخر كمستقبل
    targetUser.friends.push({
      user: req.user.id,
      status: 'pending'
    });

    await targetUser.save();

    // إرسال إشعار
    const fcmTokens = targetUser.getActiveFcmTokens();
    if (fcmTokens.length > 0) {
      await sendPushNotification(
        fcmTokens[0],
        {
          title: 'Friend Request',
          body: `${currentUser.fullName} sent you a friend request`
        },
        {
          type: 'friend_request',
          userId: req.user.id
        }
      );
    }

    return successResponse(res, 'Friend request sent');

  } catch (error) {
    console.error('❌ Send friend request error:', error);
    return errorResponse(res, 'Error sending friend request', 500);
  }
};

/**
 * قبول/رفض طلب صداقة
 * PUT /api/users/friends/respond
 */
exports.respondToFriendRequest = async (req, res) => {
  try {
    const { userId, action } = req.body; // action: 'accept' or 'reject'

    const currentUser = await User.findById(req.user.id);
    const requester = await User.findById(userId);

    // تحديث حالة الطلب للمستخدم الحالي
    const myRequest = currentUser.friends.find(f => 
      f.user.toString() === userId && f.status === 'pending'
    );

    if (!myRequest) {
      return errorResponse(res, 'Friend request not found', 404);
    }

    if (action === 'accept') {
      myRequest.status = 'accepted';
      
      // تحديث للطرف الآخر
      const theirRequest = requester.friends.find(f => 
        f.user.toString() === req.user.id
      );
      if (theirRequest) {
        theirRequest.status = 'accepted';
      }

      // إرسال إشعار بالقبول
      const fcmTokens = requester.getActiveFcmTokens();
      if (fcmTokens.length > 0) {
        await sendPushNotification(
          fcmTokens[0],
          {
            title: 'Friend Request Accepted',
            body: `${currentUser.fullName} accepted your friend request`
          },
          {
            type: 'friend_accepted',
            userId: req.user.id
          }
        );
      }
    } else {
      // رفض - إزالة الطلب
      currentUser.friends = currentUser.friends.filter(f => 
        f.user.toString() !== userId
      );
      requester.friends = requester.friends.filter(f => 
        f.user.toString() !== req.user.id
      );
    }

    await currentUser.save();
    await requester.save();

    return successResponse(res, `Friend request ${action}ed`);

  } catch (error) {
    console.error('❌ Respond to friend request error:', error);
    return errorResponse(res, 'Error responding to request', 500);
  }
};

/**
 * الحصول على قائمة الأصدقاء
 * GET /api/users/friends
 */
exports.getFriends = async (req, res) => {
  try {
    const { status = 'accepted' } = req.query;

    const user = await User.findById(req.user.id)
      .populate({
        path: 'friends.user',
        select: 'username fullName avatar status lastSeen'
      });

    const friends = user.friends
      .filter(f => f.status === status)
      .map(f => ({
        ...f.user.toObject(),
        friendSince: f.addedAt,
        status: f.status
      }));

    return successResponse(res, 'Friends retrieved', { friends });

  } catch (error) {
    console.error('❌ Get friends error:', error);
    return errorResponse(res, 'Error retrieving friends', 500);
  }
};

/**
 * حظر مستخدم
 * POST /api/users/block
 */
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(req.user.id);

    if (user.blockedUsers.includes(userId)) {
      return errorResponse(res, 'User already blocked', 400);
    }

    user.blockedUsers.push(userId);
    
    // إزالة من الأصدقاء إذا كان صديقاً
    user.friends = user.friends.filter(f => f.user.toString() !== userId);

    await user.save();

    return successResponse(res, 'User blocked successfully');

  } catch (error) {
    console.error('❌ Block user error:', error);
    return errorResponse(res, 'Error blocking user', 500);
  }
};

/**
 * إلغاء حظر مستخدم
 * DELETE /api/users/block/:id
 */
exports.unblockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);

    user.blockedUsers = user.blockedUsers.filter(uid => uid.toString() !== id);

    await user.save();

    return successResponse(res, 'User unblocked successfully');

  } catch (error) {
    console.error('❌ Unblock user error:', error);
    return errorResponse(res, 'Error unblocking user', 500);
  }
};
