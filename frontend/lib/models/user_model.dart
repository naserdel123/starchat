import 'package:hive/hive.dart';

part 'user_model.g.dart';

@HiveType(typeId: 0)
class UserModel {
  @HiveField(0)
  final String id;
  
  @HiveField(1)
  final String username;
  
  @HiveField(2)
  final String fullName;
  
  @HiveField(3)
  final String phone;
  
  @HiveField(4)
  final String? email;
  
  @HiveField(5)
  final String avatarUrl;
  
  @HiveField(6)
  final String? bio;
  
  @HiveField(7)
  final String status; // online, offline, busy, away
  
  @HiveField(8)
  final DateTime? lastSeen;
  
  @HiveField(9)
  final DateTime createdAt;
  
  @HiveField(10)
  final int starsBalance;
  
  @HiveField(11)
  final int points;
  
  @HiveField(12)
  final int level;
  
  @HiveField(13)
  final UserSettings settings;

  UserModel({
    required this.id,
    required this.username,
    required this.fullName,
    required this.phone,
    this.email,
    required this.avatarUrl,
    this.bio,
    required this.status,
    this.lastSeen,
    required this.createdAt,
    this.starsBalance = 0,
    this.points = 0,
    this.level = 1,
    required this.settings,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'],
      username: json['username'],
      fullName: json['fullName'],
      phone: json['phone'],
      email: json['email'],
      avatarUrl: json['avatar']?['url'] ?? 'https://via.placeholder.com/150',
      bio: json['bio'],
      status: json['status'] ?? 'offline',
      lastSeen: json['lastSeen'] != null 
          ? DateTime.parse(json['lastSeen']) 
          : null,
      createdAt: DateTime.parse(json['createdAt']),
      starsBalance: json['stars']?['balance'] ?? 0,
      points: json['points'] ?? 0,
      level: json['level'] ?? 1,
      settings: UserSettings.fromJson(json['settings'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'fullName': fullName,
      'phone': phone,
      'email': email,
      'avatar': {'url': avatarUrl},
      'bio': bio,
      'status': status,
      'lastSeen': lastSeen?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'stars': {'balance': starsBalance},
      'points': points,
      'level': level,
      'settings': settings.toJson(),
    };
  }

  UserModel copyWith({
    String? status,
    DateTime? lastSeen,
    int? starsBalance,
    int? points,
    int? level,
  }) {
    return UserModel(
      id: id,
      username: username,
      fullName: fullName,
      phone: phone,
      email: email,
      avatarUrl: avatarUrl,
      bio: bio,
      status: status ?? this.status,
      lastSeen: lastSeen ?? this.lastSeen,
      createdAt: createdAt,
      starsBalance: starsBalance ?? this.starsBalance,
      points: points ?? this.points,
      level: level ?? this.level,
      settings: settings,
    );
  }
}

@HiveType(typeId: 1)
class UserSettings {
  @HiveField(0)
  final bool pushNotifications;
  
  @HiveField(1)
  final bool soundEnabled;
  
  @HiveField(2)
  final String theme;

  UserSettings({
    this.pushNotifications = true,
    this.soundEnabled = true,
    this.theme = 'system',
  });

  factory UserSettings.fromJson(Map<String, dynamic> json) {
    return UserSettings(
      pushNotifications: json['notifications']?['push'] ?? true,
      soundEnabled: json['notifications']?['sound'] ?? true,
      theme: json['theme'] ?? 'system',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'notifications': {
        'push': pushNotifications,
        'sound': soundEnabled,
      },
      'theme': theme,
    };
  }
}
