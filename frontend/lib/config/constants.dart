class ApiConstants {
  // For local development
  static const String baseUrl = 'http://localhost:5000/api';
  static const String socketUrl = 'http://localhost:5000';
  
  // For production (Render)
  // static const String baseUrl = 'https://your-app.onrender.com/api';
  // static const String socketUrl = 'https://your-app.onrender.com';
  
  static const Duration timeout = Duration(seconds: 30);
  
  // Endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String users = '/users';
  static const String messages = '/messages';
  static const String groups = '/groups';
  static const String status = '/status';
  static const String gifts = '/gifts';
}

class StorageKeys {
  static const String token = 'auth_token';
  static const String user = 'user_data';
  static const String theme = 'app_theme';
  static const String language = 'app_language';
}

class AppConstants {
  static const String appName = 'StarChat';
  static const String appVersion = '1.0.0';
  
  // Pagination
  static const int messagesPerPage = 50;
  static const int usersPerPage = 20;
  
  // Animation durations
  static const Duration fastAnimation = Duration(milliseconds: 200);
  static const Duration normalAnimation = Duration(milliseconds: 300);
  static const Duration slowAnimation = Duration(milliseconds: 500);
}
