class ApiConstants {
  // للتطوير المحلي
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:5000/api',
  );
  
  static const String socketUrl = String.fromEnvironment(
    'SOCKET_URL', 
    defaultValue: 'http://localhost:5000',
  );
  
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
