import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../controllers/controllers.dart';

/// Kolom pertanyaan + tombol kirim yang menempel di bawah layar chat.
class ChatInputBar extends StatefulWidget {
  const ChatInputBar({super.key, required this.busy, required this.onSend});

  final bool busy;
  final ValueChanged<String> onSend;

  @override
  State<ChatInputBar> createState() => _ChatInputBarState();
}

class _ChatInputBarState extends State<ChatInputBar> {
  final _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    _controller.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool get _canSend => !widget.busy && _controller.text.trim().isNotEmpty;

  void _send() {
    if (!_canSend) return;
    widget.onSend(_controller.text);
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: AppColors.navShadow,
            offset: Offset(0, -4),
            blurRadius: 16,
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        minimum: const EdgeInsets.fromLTRB(12, 10, 12, 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                key: const ValueKey('assistant-input'),
                controller: _controller,
                minLines: 1,
                maxLines: 4,
                maxLength: AssistantController.maxLength,
                textInputAction: TextInputAction.send,
                textCapitalization: TextCapitalization.sentences,
                onSubmitted: (_) => _send(),
                style: AppText.poppins(14),
                decoration: InputDecoration(
                  hintText: 'Tanyakan acara, sejarah tari, sewa gedung…',
                  hintStyle: AppText.poppins(13, color: AppColors.muted),
                  counterText: '',
                  filled: true,
                  fillColor: AppColors.cream,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(
                      color: AppColors.maroon,
                      width: 1.5,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              tooltip: 'Kirim',
              onPressed: _canSend ? _send : null,
              style: IconButton.styleFrom(
                backgroundColor: AppColors.maroon,
                foregroundColor: AppColors.white,
                disabledBackgroundColor: AppColors.divider,
                disabledForegroundColor: AppColors.muted,
                fixedSize: const Size(46, 46),
              ),
              icon: const Icon(Icons.send_rounded, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}
