/**
 * messageController.js
 * التحكم بالرسائل
 */

const Message = require('../models/Message');
const User = require('../models/User');
const { encryptMessage, decryptMessage } = require('../utils/encryption');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

/**
 * إرسال رسالة
 * POST /api/messages
 */
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text', replyTo, media, location, contact } = req.body;

    // التحقق من وجود المستقبل
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return errorResponse(res, 'Receiver not found', 404);
    }

    // التحقق من عدم الحظر
    const sender = await User.findById(req.user.id);
    if (sender.blockedUsers.includes(receiverId)) {
      return errorResponse(res, 'You have blocked this user', 403);
    }
    if (receiver.blockedUsers.includes(req.user.id)) {
      return errorResponse(res, 'You are blocked by this user', 403);
    }

    // تشفير المحتوى إذا كان نصاً
    let encryptedContent = content;
    if (messageType === 'text' && content) {
      encryptedContent = encryptMessage(content);
    }

    // إنشاء الرسالة
    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      content: encryptedContent,
      messageType,
      replyTo,
      media,
      location,
      contact,
      isEncrypted: messageType === 'text'
    });

    // تحديث إحصائيات المرسل
    sender.stats.messagesSent += 1;
    await sender.save();

    // إرسال عبر Socket.io (سيتم معالجته في server.js)
    req.app.get('io').to(receiverId).emit('new_message', {
      message: {
        ...message.toObject(),
        content: messageType === 'text' ? content : message.content // إرساء النص الأصلي للمستقبل
      }
    });

    // إرسال إشعار FCM
    const fcmTokens = receiver.getActiveFcmTokens();
    if (fcmTokens.length > 0 && receiver.settings.notifications.push) {
      await sendPushNotification(
        fcmTokens[0],
        {
          title: sender.fullName,
          body: messageType === 'text' ? content : `Sent a ${messageType}`,
          imageUrl: sender.avatar.url
        },
        {
          type: 'new_message',
          messageId: message._id.toString(),
          senderId: req.user.id
        }
      );
    }

    return successResponse(res, 'Message sent', { message }, 201);

  } catch (error) {
    console.error('❌ Send message error:', error);
    return errorResponse(res, 'Error sending message', 500);
  }
};

/**
 * الحصول على المحادثة
 * GET /api/messages/:userId
 */
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    const messages = await Message.getConversation(
      req.user.id,
      userId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        before: before ? new Date(before) : undefined
      }
    );

    // فك تشفير الرسائل النصية
    const decryptedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      if (msg.isEncrypted && msg.content) {
        try {
          msgObj.content = decryptMessage(msg.content);
        } catch (e) {
          msgObj.content = '[Unable to decrypt]';
        }
      }
      return msgObj;
    });

    return successResponse(res, 'Conversation retrieved', {
      messages: decryptedMessages.reverse() // ترتيب تصاعدي
    });

  } catch (error) {
    console.error('❌ Get conversation error:', error);
    return errorResponse(res, 'Error retrieving conversation', 500);
  }
};

/**
 * تحديث حالة القراءة
 * PUT /api/messages/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;

    await Message.markAsRead(messageIds, req.user.id);

    // إشعار المرسلين بقراءة رسائلهم
    const messages = await Message.find({ _id: { $in: messageIds } });
    
    messages.forEach(msg => {
      req.app.get('io').to(msg.sender.toString()).emit('messages_read', {
        messageIds: [msg._id],
        by: req.user.id,
        readAt: new Date()
      });
    });

    return successResponse(res, 'Messages marked as read');

  } catch (error) {
    console.error('❌ Mark as read error:', error);
    return errorResponse(res, 'Error marking messages as read', 500);
  }
};

/**
 * إضافة رد فعل (Reaction)
 * POST /api/messages/:id/reaction
 */
exports.addReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(id);
    if (!message) {
      return errorResponse(res, 'Message not found', 404);
    }

    // التحقق من أن المستخدم طرف في المحادثة
    if (message.sender.toString() !== req.user.id && 
        message.receiver.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 403);
    }

    // إزالة الرد السابق إن وجد
    message.reactions = message.reactions.filter(r => 
      r.user.toString() !== req.user.id
    );

    // إضافة الرد الجديد
    message.reactions.push({
      user: req.user.id,
      emoji
    });

    await message.save();

    // إشعار الطرف الآخر
    const notifyUserId = message.sender.toString() === req.user.id 
      ? message.receiver 
      : message.sender;

    req.app.get('io').to(notifyUserId.toString()).emit('message_reaction', {
      messageId: id,
      userId: req.user.id,
      emoji
    });

    return successResponse(res, 'Reaction added', { message });

  } catch (error) {
    console.error('❌ Add reaction error:', error);
    return errorResponse(res, 'Error adding reaction', 500);
  }
};

/**
 * حذف رسالة
 * DELETE /api/messages/:id
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { forEveryone = false } = req.body;

    const message = await Message.findById(id);
    if (!message) {
      return errorResponse(res, 'Message not found', 404);
    }

    // التحقق من الصلاحيات
    if (message.sender.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 403);
    }

    if (forEveryone) {
      // الحذف للجميع (خلال 15 دقيقة فقط)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (message.createdAt < fifteenMinutesAgo) {
        return errorResponse(res, 'Cannot delete message for everyone after 15 minutes', 400);
      }

      message.isDeletedForEveryone = true;
      message.deletedAt = new Date();
      message.content = '[This message was deleted]';
      await message.save();

      // إشعار الطرف الآخر
      req.app.get('io').to(message.receiver.toString()).emit('message_deleted', {
        messageId: id,
        forEveryone: true
      });
    } else {
      // الحذف للمستخدم فقط
      message.deletedFor.push({
        user: req.user.id
      });
      await message.save();
    }

    return successResponse(res, 'Message deleted');

  } catch (error) {
    console.error('❌ Delete message error:', error);
    return errorResponse(res, 'Error deleting message', 500);
  }
};

/**
 * تحرير رسالة
 * PUT /api/messages/:id
 */
exports.editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const message = await Message.findById(id);
    if (!message) {
      return errorResponse(res, 'Message not found', 404);
    }

    if (message.sender.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 403);
    }

    if (message.messageType !== 'text') {
      return errorResponse(res, 'Can only edit text messages', 400);
    }

    // التحقق من عدم تجاوز 15 دقيقة
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return errorResponse(res, 'Cannot edit message after 15 minutes', 400);
    }

    message.content = encryptMessage(content);
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // إشعار الطرف الآخر
    req.app.get('io').to(message.receiver.toString()).emit('message_edited', {
      messageId: id,
      content,
      editedAt: message.editedAt
    });

    return successResponse(res, 'Message edited', { message });

  } catch (error) {
    console.error('❌ Edit message error:', error);
    return errorResponse(res, 'Error editing message', 500);
  }
};
