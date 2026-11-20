import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../domain/entities/assistant_message.dart';

/// Ikon bulat Tanya Krida (avatar asisten).
class AssistantAvatar extends StatelessWidget {
  const AssistantAvatar({super.key, this.size = 30});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.maroon, AppColors.maroonDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
      ),
      child: Icon(
        Icons.auto_awesome_rounded,
        color: AppColors.gold,
        size: size * 0.52,
      ),
    );
  }
}

/// Satu gelembung percakapan: pertanyaan pengguna (kanan, maroon) atau
/// jawaban asisten (kiri, putih) beserta tombol pintasan ke layar aplikasi.
class ChatBubble extends StatelessWidget {
  const ChatBubble({
    super.key,
    required this.message,
    this.onLink,
    this.onRetry,
  });

  final AssistantMessage message;
  final ValueChanged<AssistantLink>? onLink;

  /// Tombol "Coba lagi" untuk pesan gagal.
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final maxWidth = MediaQuery.sizeOf(context).width * 0.78;
    if (message.isUser) {
      return Align(
        alignment: Alignment.centerRight,
        child: Container(
          constraints: BoxConstraints(maxWidth: maxWidth),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: const BoxDecoration(
            color: AppColors.maroon,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(18),
              topRight: Radius.circular(18),
              bottomLeft: Radius.circular(18),
              bottomRight: Radius.circular(4),
            ),
          ),
          child: SelectableText(
            message.text,
            style: AppText.poppins(13, color: AppColors.white, height: 1.45),
          ),
        ),
      );
    }

    final error = message.isError;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const AssistantAvatar(),
        const SizedBox(width: 8),
        Flexible(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: error ? const Color(0xFFFCEEEE) : AppColors.white,
                    border: Border.all(
                      color: error
                          ? const Color(0x33B3261E)
                          : AppColors.divider,
                    ),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(4),
                      topRight: Radius.circular(18),
                      bottomLeft: Radius.circular(18),
                      bottomRight: Radius.circular(18),
                    ),
                    boxShadow: const [
                      BoxShadow(
                        color: AppColors.cardShadow,
                        offset: Offset(0, 2),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (error)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.error_outline_rounded,
                                size: 16,
                                color: AppColors.error,
                              ),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  'Gagal mendapat jawaban',
                                  style: AppText.poppins(
                                    12,
                                    weight: FontWeight.w600,
                                    color: AppColors.error,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      SelectableText(
                        message.text,
                        style: AppText.poppins(13, height: 1.5),
                      ),
                    ],
                  ),
                ),
                if (error && onRetry != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: TextButton.icon(
                      onPressed: onRetry,
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text('Coba lagi'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.maroon,
                        textStyle: AppText.poppins(12, weight: FontWeight.w600),
                      ),
                    ),
                  ),
                if (message.links.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final link in message.links)
                          _LinkButton(
                            link: link,
                            onTap: () => onLink?.call(link),
                          ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _LinkButton extends StatelessWidget {
  const _LinkButton({required this.link, required this.onTap});

  final AssistantLink link;
  final VoidCallback onTap;

  static IconData iconOf(AssistantLinkKind kind) => switch (kind) {
    AssistantLinkKind.event => Icons.theater_comedy_outlined,
    AssistantLinkKind.rental => Icons.apartment_rounded,
    AssistantLinkKind.community => Icons.groups_outlined,
    AssistantLinkKind.calendar => Icons.event_note_outlined,
    AssistantLinkKind.myTickets => Icons.confirmation_number_outlined,
    AssistantLinkKind.gallery => Icons.photo_library_outlined,
    AssistantLinkKind.education => Icons.auto_stories_outlined,
    AssistantLinkKind.profile => Icons.map_outlined,
  };

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.goldTint,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(iconOf(link.kind), size: 16, color: AppColors.maroon),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  link.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.poppins(
                    12,
                    weight: FontWeight.w600,
                    color: AppColors.maroon,
                  ),
                ),
              ),
              const SizedBox(width: 2),
              const Icon(
                Icons.chevron_right_rounded,
                size: 16,
                color: AppColors.maroon,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Indikator "sedang mengetik": tiga titik yang berdenyut bergantian.
class TypingBubble extends StatefulWidget {
  const TypingBubble({super.key});

  @override
  State<TypingBubble> createState() => _TypingBubbleState();
}

class _TypingBubbleState extends State<TypingBubble>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Tanya Krida sedang menyiapkan jawaban',
      child: Row(
        children: [
          const AssistantAvatar(),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppColors.white,
              border: Border.all(color: AppColors.divider),
              borderRadius: BorderRadius.circular(18),
            ),
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, _) => Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (var i = 0; i < 3; i++)
                    Padding(
                      padding: EdgeInsets.only(left: i == 0 ? 0 : 5),
                      child: Opacity(
                        opacity: _dotOpacity(i),
                        child: const CircleAvatar(
                          radius: 3.5,
                          backgroundColor: AppColors.maroon,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  double _dotOpacity(int index) {
    final t = (_controller.value - index * 0.2) % 1.0;
    return 0.3 + 0.7 * (t < 0.5 ? t * 2 : (1 - t) * 2);
  }
}
