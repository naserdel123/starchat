/**
 * groupController.js
 * التحكم بالمجموعات
 */

const Group = require('../models/Group');
const Message = require('../models/Message');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * إنشاء مجموعة
 * POST /api/groups
 */
exports.createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    const group = await Group.create({
      name,
      description,
      owner: req.user.id,
      members: [
        { user: req.user.id, role: 'owner' },
        ...members.map(id => ({ user: id, role: 'member', addedBy: req.user.id }))
      ]
    });

    // إشعار الأعضاء
    members.forEach(memberId => {
      req.app.get('io').to(memberId).emit('added_to_group', {
        groupId: group._id,
        groupName: name
      });
    });

    return successResponse(res, 'Group created successfully', { group }, 201);

  } catch (error) {
    console.error('❌ Create group error:', error);
    return errorResponse(res, 'Error creating group', 500);
  }
};

/**
 * إرسال رسالة للمجموعة
 * POST /api/groups/:id/messages
 */
exports.sendGroupMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, messageType = 'text' } = req.body;

    const group = await Group.findById(id);
    if (!group) {
      return errorResponse(res, 'Group not found', 404);
    }

    if (!group.isMember(req.user.id)) {
      return errorResponse(res, 'Not a member of this group', 403);
    }

    // التحقق من صلاحية الإرسال
    if (group.settings.onlyAdminsCanPost && !group.isAdmin(req.user.id)) {
      return errorResponse(res, 'Only admins can post in this group', 403);
    }

    const message = await Message.create({
      sender: req.user.id,
      group: id,
      content,
      messageType,
      isGroupMessage: true
    });

    // إشعار الأعضاء
    group.members.forEach(member => {
      if (member.user.toString() !== req.user.id) {
        req.app.get('io').to(member.user.toString()).emit('group_message', {
          groupId: id,
          message
        });
      }
    });

    return successResponse(res, 'Message sent', { message }, 201);

  } catch (error) {
    console.error('❌ Send group message error:', error);
    return errorResponse(res, 'Error sending message', 500);
  }
};

/**
 * إضافة عضو للمجموعة
 * POST /api/groups/:id/members
 */
exports.addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(id);
    if (!group) {
      return errorResponse(res, 'Group not found', 404);
    }

    if (!group.isAdmin(req.user.id)) {
      return errorResponse(res, 'Only admins can add members', 403);
    }

    await group.addMember(userId, req.user.id);

    // إشعار العضو الجديد
    req.app.get('io').to(userId).emit('added_to_group', {
      groupId: id,
      groupName: group.name
    });

    return successResponse(res, 'Member added successfully');

  } catch (error) {
    console.error('❌ Add member error:', error);
    return errorResponse(res, error.message || 'Error adding member', 500);
  }
};

/**
 * إنشاء رابط دعوة
 * POST /api/groups/:id/invite
 */
exports.createInviteLink = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id);
    if (!group) {
      return errorResponse(res, 'Group not found', 404);
    }

    if (!group.isAdmin(req.user.id)) {
      return errorResponse(res, 'Only admins can create invite links', 403);
    }

    await group.createInviteLink();

    return successResponse(res, 'Invite link created', {
      link: `${process.env.API_URL}/join/${group.inviteLink.code}`
    });

  } catch (error) {
    console.error('❌ Create invite link error:', error);
    return errorResponse(res, 'Error creating invite link', 500);
  }
};
