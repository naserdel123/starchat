import 'package:flutter/foundation.dart';
import '../models/message_model.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../config/constants.dart';

class ChatProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final SocketService _socket = SocketService();
  
  List<MessageModel> _messages = [];
  List<UserModel> _conversations = [];
  bool _isLoading = false;
  String? _currentChatId;
  bool _isTyping = false;
  Map<String, bool> _typingUsers = {};

  // Getters
  List<MessageModel> get messages => _messages;
  List<UserModel> get conversations => _conversations;
  bool get isLoading => _isLoading;
  String? get currentChatId => _currentChatId;
  bool get isTyping => _isTyping;
  Map<String, bool> get typingUsers => _typingUsers;

  void initializeSocket(String userId, String token) {
    _socket.initialize(userId, token);
    
    _socket.onNewMessage((data) {
      final message = MessageModel.fromJson(data['message']);
      if (_currentChatId == message.senderId || _currentChatId == message.receiverId) {
        _messages.insert(0, message);
        notifyListeners();
        
        // Mark as read immediately if in chat
        if (!message.isMe) {
          markAsRead([message.id], message.senderId);
        }
      }
    });

    _socket.onTyping((data) {
      _typingUsers[data['userId']] = data['isTyping'];
      notifyListeners();
    });

    _socket.onMessagesRead((data) {
      // Update message status
      final messageIds = List<String>.from(data['messageIds']);
      for (var msg in _messages) {
        if (messageIds.contains(msg.id)) {
          final index = _messages.indexOf(msg);
          _messages[index] = msg.copyWith(status: 'read', readAt: DateTime.parse(data['readAt']));
        }
      }
      notifyListeners();
    });
  }

  Future<void> loadConversation(String userId, {bool loadMore = false}) async {
    if (!loadMore) {
      _isLoading = true;
      _currentChatId = userId;
      _messages = [];
      notifyListeners();
    }

    try {
      final before = loadMore && _messages.isNotEmpty 
          ? _messages.last.createdAt.toIso8601String() 
          : null;
          
      final response = await _api.get(
        '${ApiConstants.messages}/$userId',
        queryParameters: {
          if (before != null) 'before': before,
          'limit': ApiConstants.messagesPerPage,
        },
      );

      final newMessages = (response.data['data']['messages'] as List)
          .map((m) => MessageModel.fromJson(m))
          .toList();

      if (loadMore) {
        _messages.addAll(newMessages);
      } else {
        _messages = newMessages;
      }
    } catch (e) {
      debugPrint('Error loading conversation: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> sendMessage({
    required String receiverId,
    required String content,
    String messageType = 'text',
    String? replyToId,
  }) async {
    // Optimistic update
    final tempMessage = MessageModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      senderId: 'me',
      receiverId: receiverId,
      content: content,
      messageType: messageType,
      createdAt: DateTime.now(),
      status: 'sent',
      replyToId: replyToId,
    );
    
    _messages.insert(0, tempMessage);
    notifyListeners();

    try {
      final response = await _api.post(ApiConstants.messages, data: {
        'receiverId': receiverId,
        'content': content,
        'messageType': messageType,
        if (replyToId != null) 'replyTo': replyToId,
      });

      // Replace temp message with real one
      final index = _messages.indexWhere((m) => m.id == tempMessage.id);
      if (index != -1) {
        _messages[index] = MessageModel.fromJson(response.data['data']['message']);
        notifyListeners();
      }
    } catch (e) {
      // Mark as failed
      final index = _messages.indexWhere((m) => m.id == tempMessage.id);
      if (index != -1) {
        _messages[index] = tempMessage.copyWith(status: 'failed');
        notifyListeners();
      }
    }
  }

  void setTyping(String receiverId, bool isTyping) {
    _isTyping = isTyping;
    _socket.sendTyping(receiverId, isTyping);
    notifyListeners();
  }

  void markAsRead(List<String> messageIds, String senderId) {
    _socket.markAsRead(messageIds, senderId);
  }

  Future<void> addReaction(String messageId, String emoji) async {
    try {
      await _api.post('${ApiConstants.messages}/$messageId/reaction', data: {
        'emoji': emoji,
      });
    } catch (e) {
      debugPrint('Error adding reaction: $e');
    }
  }

  void clearChat() {
    _messages = [];
    _currentChatId = null;
    _socket.removeListeners();
    notifyListeners();
  }
}
