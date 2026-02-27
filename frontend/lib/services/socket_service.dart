import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/constants.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  String? _userId;
  final List<Function(Map<String, dynamic>)> _messageListeners = [];
  final List<Function(Map<String, dynamic>)> _typingListeners = [];
  final List<Function(Map<String, dynamic>)> _readListeners = [];

  void initialize(String userId, String token) {
    _userId = userId;
    
    _socket = IO.io(ApiConstants.socketUrl, IO.OptionBuilder()
        .setTransports(['websocket'])
        .enableAutoConnect()
        .enableReconnection()
        .setAuth({'token': token})
        .build());

    _socket!.onConnect((_) {
      debugPrint('✅ Socket connected');
      _socket!.emit('user_online', userId);
    });

    _socket!.onDisconnect((_) {
      debugPrint('❌ Socket disconnected');
    });

    _socket!.onConnectError((error) {
      debugPrint('❌ Socket connection error: $error');
    });

    // Listen for new messages
    _socket!.on('new_message', (data) {
      for (var listener in _messageListeners) {
        listener(data);
      }
    });

    // Listen for typing indicators
    _socket!.on('typing', (data) {
      for (var listener in _typingListeners) {
        listener(data);
      }
    });

    // Listen for read receipts
    _socket!.on('messages_read', (data) {
      for (var listener in _readListeners) {
        listener(data);
      }
    });

    _socket!.on('gift_received', (data) {
      // Handle gift notification
      debugPrint('🎁 Gift received: $data');
    });
  }

  void joinGroup(String groupId) {
    _socket?.emit('join_group', groupId);
  }

  void leaveGroup(String groupId) {
    _socket?.emit('leave_group', groupId);
  }

  void sendTyping(String receiverId, bool isTyping) {
    _socket?.emit('typing', {
      'receiverId': receiverId,
      'isTyping': isTyping,
    });
  }

  void markAsRead(List<String> messageIds, String senderId) {
    _socket?.emit('mark_read', {
      'messageIds': messageIds,
      'senderId': senderId,
    });
  }

  void onNewMessage(Function(Map<String, dynamic>) callback) {
    _messageListeners.add(callback);
  }

  void onTyping(Function(Map<String, dynamic>) callback) {
    _typingListeners.add(callback);
  }

  void onMessagesRead(Function(Map<String, dynamic>) callback) {
    _readListeners.add(callback);
  }

  void removeListeners() {
    _messageListeners.clear();
    _typingListeners.clear();
    _readListeners.clear();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  bool get isConnected => _socket?.connected ?? false;
}
