import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/constants.dart';
import '../models/user_model.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  late SharedPreferences _prefs;
  late Box<UserModel> _userBox;
  late Box _settingsBox;

  Future<void> initialize() async {
    await Hive.initFlutter();
    
    // Register adapters
    Hive.registerAdapter(UserModelAdapter());
    Hive.registerAdapter(UserSettingsAdapter());
    
    _prefs = await SharedPreferences.getInstance();
    _userBox = await Hive.openBox<UserModel>('users');
    _settingsBox = await Hive.openBox('settings');
  }

  // Token management
  Future<void> saveToken(String token) async {
    await _prefs.setString(StorageKeys.token, token);
  }

  Future<String?> getToken() async {
    return _prefs.getString(StorageKeys.token);
  }

  Future<void> clearToken() async {
    await _prefs.remove(StorageKeys.token);
  }

  // User management
  Future<void> saveUser(UserModel user) async {
    await _userBox.put('current_user', user);
  }

  UserModel? getUser() {
    return _userBox.get('current_user');
  }

  Future<void> clearUser() async {
    await _userBox.delete('current_user');
  }

  // Theme
  Future<void> saveTheme(String theme) async {
    await _settingsBox.put(StorageKeys.theme, theme);
  }

  String getTheme() {
    return _settingsBox.get(StorageKeys.theme, defaultValue: 'system');
  }

  // Clear all
  Future<void> clearAll() async {
    await _prefs.clear();
    await _userBox.clear();
  }
}
