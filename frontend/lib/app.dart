import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/splash/splash_screen.dart';

class App extends StatelessWidget {
  const App({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // Show splash screen while checking auth
        if (authProvider.isLoading) {
          return const SplashScreen();
        }
        
        // Show home or login based on auth state
        return authProvider.isAuthenticated 
            ? const HomeScreen() 
            : const LoginScreen();
      },
    );
  }
}
