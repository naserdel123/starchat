import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../config/constants.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final StorageService _storage = StorageService();
  
  UserModel? _user;
  bool _isLoading = true;
  bool _isAuthenticated = false;
  String? _error;

  // Getters
  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get error => _error;

  AuthProvider() {
    _api.initialize();
    checkAuthStatus();
  }

  Future<void> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _storage.getToken();
      if (token != null) {
        // Verify token and get user data
        final response = await _api.get(ApiConstants.me);
        _user = UserModel.fromJson(response.data['data']['user']);
        await _storage.saveUser(_user!);
        _isAuthenticated = true;
      }
    } catch (e) {
      _isAuthenticated = false;
      await _storage.clearToken();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String phone, String password, {String? fcmToken}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post(ApiConstants.login, data: {
        'phone': phone,
        'password': password,
        'fcmToken': fcmToken,
        'device': 'mobile',
      });

      final token = response.data['data']['token'];
      await _storage.saveToken(token);

      _user = UserModel.fromJson(response.data['data']['user']);
      await _storage.saveUser(_user!);

      _isAuthenticated = true;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> register({
    required String phone,
    required String username,
    required String fullName,
    required String password,
    String? email,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post(ApiConstants.register, data: {
        'phone': phone,
        'username': username,
        'fullName': fullName,
        'password': password,
        'email': email,
      });

      final token = response.data['data']['token'];
      await _storage.saveToken(token);

      _user = UserModel.fromJson(response.data['data']['user']);
      await _storage.saveUser(_user!);

      _isAuthenticated = true;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    try {
      await _api.post(ApiConstants.logout);
    } catch (e) {
      // Ignore error
    } finally {
      await _storage.clearAll();
      _user = null;
      _isAuthenticated = false;
      notifyListeners();
    }
  }

  Future<void> updateProfile({String? fullName, String? bio}) async {
    try {
      final response = await _api.put(ApiConstants.me, data: {
        if (fullName != null) 'fullName': fullName,
        if (bio != null) 'bio': bio,
      });

      _user = UserModel.fromJson(response.data['data']['user']);
      await _storage.saveUser(_user!);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    }
  }
}
