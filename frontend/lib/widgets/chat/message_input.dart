import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:emoji_picker_flutter/emoji_picker_flutter.dart';

class MessageInput extends StatefulWidget {
  final Function(String) onSend;
  final Function(bool) onTyping;

  const MessageInput({
    Key? key,
    required this.onSend,
    required this.onTyping,
  }) : super(key: key);

  @override
  State<MessageInput> createState() => _MessageInputState();
}

class _MessageInputState extends State<MessageInput> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  bool _showEmojiPicker = false;
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onTextChanged);
  }

  void _onTextChanged() {
    final isTyping = _controller.text.isNotEmpty;
    if (isTyping != _isTyping) {
      _isTyping = isTyping;
      widget.onTyping(isTyping);
    }
  }

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isNotEmpty) {
      widget.onSend(text);
      _controller.clear();
      widget.onTyping(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(8.w),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                // Attachment button
                IconButton(
                  icon: const Icon(Icons.add_circle_outline),
                  onPressed: () {
                    // Show attachment options
                    _showAttachmentOptions();
                  },
                ),
                
                // Text field
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.background,
                      borderRadius: BorderRadius.circular(24.r),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _controller,
                            focusNode: _focusNode,
                            decoration: InputDecoration(
                              hintText: 'Type a message...',
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 16.w,
                                vertical: 12.h,
                              ),
                            ),
                            onTap: () {
                              if (_showEmojiPicker) {
                                setState(() => _showEmojiPicker = false);
                              }
                            },
                          ),
                        ),
                        
                        // Emoji button
                        IconButton(
                          icon: Icon(
                            _showEmojiPicker ? Icons.keyboard : Icons.emoji_emotions_outlined,
                          ),
                          onPressed: () {
                            setState(() {
                              _showEmojiPicker = !_showEmojiPicker;
                              if (_showEmojiPicker) {
                                _focusNode.unfocus();
                              } else {
                                _focusNode.requestFocus();
                              }
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                
                SizedBox(width: 8.w),
                
                // Send button
                GestureDetector(
                  onTap: _sendMessage,
                  child: Container(
                    width: 48.w,
                    height: 48.w,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Theme.of(context).colorScheme.primary,
                          Theme.of(context).colorScheme.secondary,
                        ],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.send,
                      color: Colors.white,
                      size: 24.w,
                    ),
                  ),
                ),
              ],
            ),
            
            // Emoji picker
            if (_showEmojiPicker)
              SizedBox(
                height: 250.h,
                child: EmojiPicker(
                  onEmojiSelected: (category, emoji) {
                    _controller.text += emoji.emoji;
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showAttachmentOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return Container(
          padding: EdgeInsets.all(16.w),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.image, color: Colors.purple),
                title: const Text('Gallery'),
                onTap: () {
                  Navigator.pop(context);
                  // Pick image
                },
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt, color: Colors.red),
                title: const Text('Camera'),
                onTap: () {
                  Navigator.pop(context);
                  // Take photo
                },
              ),
              ListTile(
                leading: const Icon(Icons.videocam, color: Colors.blue),
                title: const Text('Video'),
                onTap: () {
                  Navigator.pop(context);
                  // Pick video
                },
              ),
              ListTile(
                leading: const Icon(Icons.location_on, color: Colors.green),
                title: const Text('Location'),
                onTap: () {
                  Navigator.pop(context);
                  // Share location
                },
              ),
              ListTile(
                leading: const Icon(Icons.card_giftcard, color: Colors.orange),
                title: const Text('Gift'),
                onTap: () {
                  Navigator.pop(context);
                  // Send gift
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }
}
