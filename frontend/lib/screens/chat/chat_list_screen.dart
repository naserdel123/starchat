import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/chat/chat_list_item.dart';
import '../../widgets/common/shimmer_loading.dart';
import 'chat_screen.dart';

class ChatListScreen extends StatelessWidget {
  const ChatListScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // Show search
            },
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {
              // Show menu
            },
          ),
        ],
      ),
      body: StreamBuilder(
        // This would be a stream from your backend
        stream: null,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return ListView.builder(
              itemCount: 10,
              itemBuilder: (_, __) => const ShimmerChatItem(),
            );
          }

          return ListView.builder(
            padding: EdgeInsets.symmetric(vertical: 8.h),
            itemCount: 10, // Replace with actual data
            itemBuilder: (context, index) {
              return ChatListItem(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ChatScreen(
                        userId: 'user_$index',
                        userName: 'User $index',
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Start new chat
        },
        child: const Icon(Icons.chat),
      ),
    );
  }
}
