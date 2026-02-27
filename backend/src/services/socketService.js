/**
 * socketService.js
 * إدارة WebSocket باستخدام Socket.io
 */

const User = require('../models/User');
const Message = require('../models/Message');

/**
 * تهيئة Socket.io
 * @param {Object} io - كائن Socket.io
 */
const initializeSocket = (io) => {
  // تخزين المستخدمين المتصلين
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    // تسجيل دخول المستخدم
    socket.on('user_online', async (userId) => {
      try {
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;

        // تحديث حالة المستخدم
        await User.findByIdAndUpdate(userId, {
          status: 'online',
          lastSeen: new Date()
        });

        // إشعار الأصدقاء
        const user = await User.findById(userId).populate('friends.user');
        user.friends
          .filter(f => f.status === 'accepted')
          .forEach(friend => {
            const friendSocketId = connectedUsers.get(friend.user._id.toString());
            if (friendSocketId) {
              io.to(friendSocketId).emit('friend_online', { userId });
            }
          });

        // الانضمام لغرفة المستخدم (للرسائل الخاصة)
        socket.join(userId);

        console.log(`✅ User ${userId} is online`);

      } catch (error) {
        console.error('❌ User online error:', error);
      }
    });

    // انضمام لمجموعة
    socket.on('join_group', (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`👥 User ${socket.userId} joined group ${groupId}`);
    });

    // مغادرة مجموعة
    socket.on('leave_group', (groupId) => {
      socket.leave(`group_${groupId}`);
    });

    // كتابة...
    socket.on('typing', async (data) => {
      const { receiverId, isTyping } = data;
      
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', {
          userId: socket.userId,
          isTyping
        });
      }
    });

    // قراءة رسائل
    socket.on('mark_read', async (data) => {
      const { messageIds, senderId } = data;
      
      await Message.markAsRead(messageIds, socket.userId);
      
      const senderSocketId = connectedUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('messages_read', {
          messageIds,
          by: socket.userId,
          readAt: new Date()
        });
      }
    });

    // مكالمة صوتية/مرئية
    socket.on('call_request', (data) => {
      const { receiverId, callType, signalData } = data;
      
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incoming_call', {
          callerId: socket.userId,
          callType,
          signalData
        });
      }
    });

    socket.on('call_accepted', (data) => {
      const { callerId, signalData } = data;
      const callerSocketId = connectedUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_accepted', { signalData });
      }
    });

    socket.on('call_rejected', (data) => {
      const { callerId } = data;
      const callerSocketId = connectedUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_rejected');
      }
    });

    socket.on('call_ended', (data) => {
      const { userId } = data;
      const userSocketId = connectedUsers.get(userId);
      if (userSocketId) {
        io.to(userSocketId).emit('call_ended');
      }
    });

    // قطع الاتصال
    socket.on('disconnect', async () => {
      try {
        if (socket.userId) {
          connectedUsers.delete(socket.userId);

          // تحديث حالة المستخدم
          await User.findByIdAndUpdate(socket.userId, {
            status: 'offline',
            lastSeen: new Date()
          });

          // إشعار الأصدقاء
          const user = await User.findById(socket.userId).populate('friends.user');
          user.friends
            .filter(f => f.status === 'accepted')
            .forEach(friend => {
              const friendSocketId = connectedUsers.get(friend.user._id.toString());
              if (friendSocketId) {
                io.to(friendSocketId).emit('friend_offline', {
                  userId: socket.userId,
                  lastSeen: new Date()
                });
              }
            });

          console.log(`❌ User ${socket.userId} disconnected`);
        }
      } catch (error) {
        console.error('❌ Disconnect error:', error);
      }
    });
  });

  // جعل io متاحاً للـ controllers
  return io;
};

module.exports = { initializeSocket };
