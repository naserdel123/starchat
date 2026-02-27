import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/chat/message_bubble.dart';
import '../../widgets/chat/message_input.dart';

class ChatScreen extends StatefulWidget {
  final String userId;
  final String userName;

  const ChatScreen({
    Key? key,
    required this.userId,
    required this.userName,
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ChatProvider>(context, listen: false)
          .loadConversation(widget.userId);
    });
  }

  @override
  void dispose() {
    Provider.of<ChatProvider>(context, listen: false).clearChat();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = Provider.of<ChatProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.userName),
            if (chatProvider.typingUsers[widget.userId] == true)
              Text(
                'typing...',
                style: TextStyle(
                  fontSize: 12.sp,
                  color: Colors.green,
                  fontWeight: FontWeight.normal,
                ),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.phone),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.videocam),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: chatProvider.isLoading && chatProvider.messages.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    reverse: true,
                    padding: EdgeInsets.all(16.w),
                    itemCount: chatProvider.messages.length,
                    itemBuilder: (context, index) {
                      final message = chatProvider.messages[index];
                      return MessageBubble(
                        message: message,
                        onReaction: (emoji) {
                          chatProvider.addReaction(message.id, emoji);
                        },
                      );
                    },
                  ),
          ),
          
          // Typing indicator
          if (chatProvider.isTyping)
            Padding(
              padding: EdgeInsets.only(left: 16.w, bottom: 8.h),
              child: Row(
                children: [
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(16.r),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildDot(0),
                        SizedBox(width: 4.w),
                        _buildDot(1),
                        SizedBox(width: 4.w),
                        _buildDot(2),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          
          // Input area
          MessageInput(
            onSend: (text) {
              chatProvider.sendMessage(
                receiverId: widget.userId,
                content: text,
              );
            },
            onTyping: (isTyping) {
              chatProvider.setTyping(widget.userId, isTyping);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDot(int index) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: 8.w,
      height: 8.w,
      decoration: BoxDecoration(
        color: Colors.grey.shade500,
        shape: BoxShape.circle,
      ),
    );
  }
}
