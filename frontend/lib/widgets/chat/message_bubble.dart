import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../models/message_model.dart';

class MessageBubble extends StatelessWidget {
  final MessageModel message;
  final Function(String)? onReaction;

  const MessageBubble({
    Key? key,
    required this.message,
    this.onReaction,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isMe = message.isMe;
    final theme = Theme.of(context);

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          bottom: 8.h,
          left: isMe ? 64.w : 0,
          right: isMe ? 0 : 64.w,
        ),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            GestureDetector(
              onLongPress: () => _showReactionPicker(context),
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
                decoration: BoxDecoration(
                  gradient: isMe
                      ? LinearGradient(
                          colors: [
                            theme.colorScheme.primary,
                            theme.colorScheme.secondary,
                          ],
                        )
                      : null,
                  color: isMe ? null : theme.colorScheme.surface,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(20.r),
                    topRight: Radius.circular(20.r),
                    bottomLeft: Radius.circular(isMe ? 20.r : 4.r),
                    bottomRight: Radius.circular(isMe ? 4.r : 20.r),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Message content based on type
                    _buildContent(context),
                    
                    SizedBox(height: 4.h),
                    
                    // Time and status
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          timeago.format(message.createdAt, locale: 'en_short'),
                          style: TextStyle(
                            fontSize: 10.sp,
                            color: isMe ? Colors.white70 : Colors.grey,
                          ),
                        ),
                        if (isMe) ...[
                          SizedBox(width: 4.w),
                          Icon(
                            message.status == 'read'
                                ? Icons.done_all
                                : message.status == 'delivered'
                                    ? Icons.done_all
                                    : Icons.done,
                            size: 14.w,
                            color: message.status == 'read'
                                ? Colors.blue.shade300
                                : Colors.white70,
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            // Reactions
            if (message.reactions.isNotEmpty)
              Padding(
                padding: EdgeInsets.only(top: 4.h),
                child: Wrap(
                  spacing: 4.w,
                  children: message.reactions.map((reaction) {
                    return Container(
                      padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 2.h),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surface,
                        borderRadius: BorderRadius.circular(12.r),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 2,
                          ),
                        ],
                      ),
                      child: Text(reaction.emoji),
                    );
                  }).toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    switch (message.messageType) {
      case 'text':
        return Text(
          message.content,
          style: TextStyle(
            color: message.isMe ? Colors.white : null,
            fontSize: 14.sp,
          ),
        );
        
      case 'image':
        return ClipRRect(
          borderRadius: BorderRadius.circular(12.r),
          child: Image.network(
            message.media!.url,
            width: 200.w,
            fit: BoxFit.cover,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return Container(
                width: 200.w,
                height: 150.h,
                color: Colors.grey.shade300,
                child: const Center(child: CircularProgressIndicator()),
              );
            },
          ),
        );
        
      case 'gift':
        return Column(
          children: [
            Text(
              '🎁 ${message.gift!.type.toUpperCase()}',
              style: TextStyle(
                fontSize: 24.sp,
                color: message.isMe ? Colors.white : null,
              ),
            ),
            Text(
              '${message.gift!.starsValue} Stars',
              style: TextStyle(
                fontSize: 12.sp,
                color: message.isMe ? Colors.white70 : Colors.grey,
              ),
            ),
          ],
        );
        
      default:
        return Text(message.content);
    }
  }

  void _showReactionPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return Container(
          padding: EdgeInsets.all(16.w),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: ['❤️', '😂', '😮', '👍', '😢', '🎉']
                .map((emoji) => GestureDetector(
                      onTap: () {
                        onReaction?.call(emoji);
                        Navigator.pop(context);
                      },
                      child: Text(emoji, style: TextStyle(fontSize: 32.sp)),
                    ))
                .toList(),
          ),
        );
      },
    );
  }
}
