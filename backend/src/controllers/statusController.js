/**
 * statusController.js
 * التحكم بالحالات (Stories)
 */

const Status = require('../models/Status');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * نشر حالة جديدة
 * POST /api/status
 */
exports.createStatus = async (req, res) => {
  try {
    const { type, content } = req.body;

    const status = await Status.create({
      user: req.user.id,
      type,
      content
    });

    // إشعار الأصدقاء
    const user = await User.findById(req.user.id).populate('friends.user');
    user.friends
      .filter(f => f.status === 'accepted')
      .forEach(friend => {
        req.app.get('io').to(friend.user._id.toString()).emit('new_status', {
          userId: req.user.id,
          statusId: status._id
        });
      });

    return successResponse(res, 'Status created', { status }, 201);

  } catch (error) {
    console.error('❌ Create status error:', error);
    return errorResponse(res, 'Error creating status', 500);
  }
};

/**
 * الحصول على حالات الأصدقاء
 * GET /api/status/feed
 */
exports.getStatusFeed = async (req, res) => {
  try {
    // الحصول على أصدقاء المستخدم
    const user = await User.findById(req.user.id);
    const friendIds = user.friends
      .filter(f => f.status === 'accepted')
      .map(f => f.user);

    // إضافة المستخدم نفسه
    friendIds.push(req.user.id);

    const statuses = await Status.find({
      user: { $in: friendIds },
      expiresAt: { $gt: new Date() },
      isDeleted: false,
      'settings.hideFrom': { $ne: req.user.id }
    })
      .populate('user', 'username fullName avatar')
      .sort({ createdAt: -1 });

    // تنظيم حسب المستخدم
    const grouped = statuses.reduce((acc, status) => {
      const userId = status.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: status.user,
          statuses: []
        };
      }
      acc[userId].statuses.push(status);
      return acc;
    }, {});

    return successResponse(res, 'Status feed retrieved', {
      feed: Object.values(grouped)
    });

  } catch (error) {
    console.error('❌ Get status feed error:', error);
    return errorResponse(res, 'Error retrieving status feed', 500);
  }
};

/**
 * مشاهدة حالة
 * POST /api/status/:id/view
 */
exports.viewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction } = req.body;

    const status = await Status.findById(id);
    if (!status) {
      return errorResponse(res, 'Status not found', 404);
    }

    await status.addView(req.user.id, reaction);

    return successResponse(res, 'Status viewed');

  } catch (error) {
    console.error('❌ View status error:', error);
    return errorResponse(res, 'Error viewing status', 500);
  }
};
