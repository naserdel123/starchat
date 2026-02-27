import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../config/constants.dart';
import 'storage_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late Dio _dio;
  final StorageService _storage = StorageService();

  void initialize() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: ApiConstants.timeout,
      receiveTimeout: ApiConstants.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptors
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token
        final token = await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        
        if (kDebugMode) {
          print('🌐 REQUEST: ${options.method} ${options.path}');
          print('Headers: ${options.headers}');
          print('Data: ${options.data}');
        }
        
        return handler.next(options);
      },
      onResponse: (response, handler) {
        if (kDebugMode) {
          print('✅ RESPONSE: ${response.statusCode}');
          print('Data: ${response.data}');
        }
        return handler.next(response);
      },
      onError: (error, handler) {
        if (kDebugMode) {
          print('❌ ERROR: ${error.response?.statusCode}');
          print('Message: ${error.message}');
        }
        
        // Handle 401 Unauthorized
        if (error.response?.statusCode == 401) {
          _storage.clearToken();
          // Navigate to login will be handled by auth provider
        }
        
        return handler.next(error);
      },
    ));
  }

  // GET request
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // POST request
  Future<Response> post(String path, {dynamic data}) async {
    try {
      return await _dio.post(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // PUT request
  Future<Response> put(String path, {dynamic data}) async {
    try {
      return await _dio.put(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // DELETE request
  Future<Response> delete(String path, {dynamic data}) async {
    try {
      return await _dio.delete(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Upload file
  Future<Response> uploadFile(
    String path, 
    String filePath, {
    Map<String, dynamic>? additionalData,
    Function(int, int)? onProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
        ...?additionalData,
      });

      return await _dio.post(
        path,
        data: formData,
        onSendProgress: onProgress,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response?.data;
      final message = data?['message'] ?? 'An error occurred';
      return Exception(message);
    } else if (error.type == DioExceptionType.connectionTimeout) {
      return Exception('Connection timeout. Please try again.');
    } else if (error.type == DioExceptionType.connectionError) {
      return Exception('No internet connection.');
    } else {
      return Exception(error.message ?? 'Unknown error');
    }
  }
}
