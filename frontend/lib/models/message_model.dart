import 'package:hive/hive.dart';

part 'message_model.g.dart';

@HiveType(typeId: 2)
class MessageModel {
  @HiveField(0)
  final String id;
  
  @HiveField(1)
  final String senderId;
  
  @HiveField(2)
  final String receiverId;
  
  @HiveField(3)
  final String content;
  
  @HiveField(4)
  final String messageType; // text, image, video, audio, file, gift
  
  @HiveField(5)
  final DateTime createdAt;
  
  @HiveField(6)
  final String status; // sent, delivered, read
  
  @HiveField(7)
  final DateTime? readAt;
  
  @HiveField(8)
  final MediaModel? media;
  
  @HiveField(9)
  final GiftModel? gift;
  
  @HiveField(10)
  final List<ReactionModel> reactions;
  
  @HiveField(11)
  final bool isEdited;
  
  @HiveField(12)
  final String? replyToId;

  MessageModel({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.content,
    this.messageType = 'text',
    required this.createdAt,
    this.status = 'sent',
    this.readAt,
    this.media,
    this.gift,
    this.reactions = const [],
    this.isEdited = false,
    this.replyToId,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['_id'] ?? json['id'],
      senderId: json['sender'] is Map 
          ? json['sender']['_id'] 
          : json['sender'],
      receiverId: json['receiver'],
      content: json['content'],
      messageType: json['messageType'] ?? 'text',
      createdAt: DateTime.parse(json['createdAt']),
      status: json['status'] ?? 'sent',
      readAt: json['readAt'] != null 
          ? DateTime.parse(json['readAt']) 
          : null,
      media: json['media'] != null 
          ? MediaModel.fromJson(json['media']) 
          : null,
      gift: json['gift'] != null 
          ? GiftModel.fromJson(json['gift']) 
          : null,
      reactions: (json['reactions'] as List?)
          ?.map((r) => ReactionModel.fromJson(r))
          .toList() ?? [],
      isEdited: json['isEdited'] ?? false,
      replyToId: json['replyTo']?['_id'] ?? json['replyTo'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sender': senderId,
      'receiver': receiverId,
      'content': content,
      'messageType': messageType,
      'createdAt': createdAt.toIso8601String(),
      'status': status,
      'readAt': readAt?.toIso8601String(),
      'media': media?.toJson(),
      'gift': gift?.toJson(),
      'reactions': reactions.map((r) => r.toJson()).toList(),
      'isEdited': isEdited,
      'replyTo': replyToId,
    };
  }

  MessageModel copyWith({
    String? status,
    DateTime? readAt,
    List<ReactionModel>? reactions,
  }) {
    return MessageModel(
      id: id,
      senderId: senderId,
      receiverId: receiverId,
      content: content,
      messageType: messageType,
      createdAt: createdAt,
      status: status ?? this.status,
      readAt: readAt ?? this.readAt,
      media: media,
      gift: gift,
      reactions: reactions ?? this.reactions,
      isEdited: isEdited,
      replyToId: replyToId,
    );
  }

  bool get isMe => senderId == 'current_user_id'; // Will be set properly in provider
}

@HiveType(typeId: 3)
class MediaModel {
  @HiveField(0)
  final String url;
  
  @HiveField(1)
  final String? thumbnail;
  
  @HiveField(2)
  final int? duration; // in seconds
  
  @HiveField(3)
  final String? fileName;
  
  @HiveField(4)
  final int? fileSize;

  MediaModel({
    required this.url,
    this.thumbnail,
    this.duration,
    this.fileName,
    this.fileSize,
  });

  factory MediaModel.fromJson(Map<String, dynamic> json) {
    return MediaModel(
      url: json['url'],
      thumbnail: json['thumbnail'],
      duration: json['duration'],
      fileName: json['fileName'],
      fileSize: json['fileSize'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'url': url,
      'thumbnail': thumbnail,
      'duration': duration,
      'fileName': fileName,
      'fileSize': fileSize,
    };
  }
}

@HiveType(typeId: 4)
class GiftModel {
  @HiveField(0)
  final String type; // rose, teddy, diamond, crown, star
  
  @HiveField(1)
  final int starsValue;
  
  @HiveField(2)
  final String animation;

  GiftModel({
    required this.type,
    required this.starsValue,
    required this.animation,
  });

  factory GiftModel.fromJson(Map<String, dynamic> json) {
    return GiftModel(
      type: json['type'],
      starsValue: json['starsValue'],
      animation: json['animation'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'starsValue': starsValue,
      'animation': animation,
    };
  }

  String get emoji {
    switch (type) {
      case 'rose':
        return '🌹';
      case 'teddy':
        return '🧸';
      case 'diamond':
        return '💎';
      case 'crown':
        return '👑';
      case 'star':
        return '⭐';
      default:
        return '🎁';
    }
  }
}

@HiveType(typeId: 5)
class ReactionModel {
  @HiveField(0)
  final String userId;
  
  @HiveField(1)
  final String emoji;
  
  @HiveField(2)
  final DateTime createdAt;

  ReactionModel({
    required this.userId,
    required this.emoji,
    required this.createdAt,
  });

  factory ReactionModel.fromJson(Map<String, dynamic> json) {
    return ReactionModel(
      userId: json['user'] is Map 
          ? json['user']['_id'] 
          : json['user'],
      emoji: json['emoji'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': userId,
      'emoji': emoji,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
