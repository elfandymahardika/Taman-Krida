import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/breakpoints.dart';
import '../../../domain/entities/assistant_message.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import 'widgets/chat_bubble.dart';
import 'widgets/chat_input_bar.dart';

/// Tanya Krida: asisten AI yang menjawab pertanyaan pengunjung dari data
/// TKBJ (jadwal acara, tiket, sewa gedung, komunitas) lewat
/// `POST /api/assistant/chat`, lalu menawarkan tombol ke layar terkait.
class AssistantScreen extends StatelessWidget {
  const AssistantScreen({super.key});

  /// Contoh pertanyaan pada layar sambutan.
  static const starterQuestions = [
    'Apa itu Taman Krida Budaya?',
    'Ceritakan sejarah Tari Topeng Malangan',
    'Ada pertunjukan apa minggu ini?',
    'Berapa tarif sewa Pendopo Agung?',
  ];

  void _openLink(BuildContext context, AssistantLink link) {
    final navigator = Navigator.of(context);
    switch (link.kind) {
      case AssistantLinkKind.event:
        navigator.pushNamed(AppRoutes.eventDetail, arguments: link.id);
      case AssistantLinkKind.community:
        navigator.pushNamed(AppRoutes.communityDetail, arguments: link.id);
      case AssistantLinkKind.rental:
        navigator.pushNamed(AppRoutes.rental, arguments: link.id);
      case AssistantLinkKind.calendar:
        navigator.pushNamed(AppRoutes.calendar);
      case AssistantLinkKind.myTickets:
        navigator.pushNamed(AppRoutes.myTickets);
      case AssistantLinkKind.gallery:
        navigator.pushNamed(AppRoutes.gallery);
      case AssistantLinkKind.education:
        // id = materi Edukasi Budaya (mis. "tari-topeng-malangan") → langsung
        // ke materinya; tanpa id → daftar materi.
        final id = link.id;
        if (id != null &&
            context.read<EducationController>().topicById(id) != null) {
          navigator.pushNamed(
            AppRoutes.educationDetail,
            arguments: EducationArgs(id),
          );
        } else {
          navigator.pushNamed(AppRoutes.education);
        }
      case AssistantLinkKind.profile:
        navigator.pushNamed(AppRoutes.profile);
    }
  }

  @override
  Widget build(BuildContext context) {
    final assistantController = context.watch<AssistantController>();
    final messages = assistantController.messages;
    final busy = assistantController.busy;
    final last = messages.isEmpty ? null : messages.last;
    final suggestions = !busy && last != null && !last.isUser
        ? last.suggestions
        : const <String>[];

    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        backgroundColor: AppColors.maroon,
        foregroundColor: AppColors.white,
        surfaceTintColor: Colors.transparent,
        systemOverlayStyle: SystemUiOverlayStyle.light.copyWith(
          statusBarColor: Colors.transparent,
        ),
        flexibleSpace: const DecoratedBox(
          decoration: BoxDecoration(gradient: AppGradients.pageHeader),
          child: SizedBox.expand(),
        ),
        leading: Navigator.of(context).canPop()
            ? IconButton(
                tooltip: 'Kembali',
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
                iconSize: 20,
                onPressed: () => Navigator.of(context).maybePop(),
              )
            : null,
        titleSpacing: 0,
        title: Row(
          children: [
            const AssistantAvatar(size: 34),
            const SizedBox(width: 10),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Tanya Krida',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.poppins(
                      16,
                      weight: FontWeight.w600,
                      color: AppColors.white,
                    ),
                  ),
                  Text(
                    busy ? 'Sedang mengetik…' : 'Asisten AI TKBJ',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.poppins(11, color: AppColors.blush),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          if (messages.isNotEmpty)
            IconButton(
              tooltip: 'Percakapan baru',
              onPressed: busy ? null : assistantController.clear,
              icon: const Icon(Icons.add_comment_outlined),
            ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: messages.isEmpty
                ? _Welcome(onAsk: assistantController.ask)
                : _MessageList(
                    messages: messages,
                    busy: busy,
                    onLink: (link) => _openLink(context, link),
                    onRetry: assistantController.retry,
                  ),
          ),
          if (suggestions.isNotEmpty)
            _SuggestionRow(
              suggestions: suggestions,
              onTap: assistantController.ask,
            ),
          ChatInputBar(busy: busy, onSend: assistantController.ask),
        ],
      ),
    );
  }
}

class _MessageList extends StatelessWidget {
  const _MessageList({
    required this.messages,
    required this.busy,
    required this.onLink,
    required this.onRetry,
  });

  final List<AssistantMessage> messages;
  final bool busy;
  final ValueChanged<AssistantLink> onLink;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    // Daftar terbalik: pesan terbaru selalu di bawah, dekat kolom ketik.
    final items = messages.reversed.toList();
    final count = items.length + (busy ? 1 : 0);
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          maxWidth: Breakpoints.maxContentWidth,
        ),
        child: ListView.separated(
          reverse: true,
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
          itemCount: count + 1,
          separatorBuilder: (_, _) => const SizedBox(height: 14),
          itemBuilder: (context, index) {
            if (index == count) return const _Disclaimer();
            if (busy && index == 0) return const TypingBubble();
            final message = items[busy ? index - 1 : index];
            final isLastError = message.isError && message == messages.last;
            return ChatBubble(
              message: message,
              onLink: onLink,
              onRetry: isLastError && !busy ? onRetry : null,
            );
          },
        ),
      ),
    );
  }
}

/// Layar awal sebelum ada percakapan: perkenalan + contoh pertanyaan.
class _Welcome extends StatelessWidget {
  const _Welcome({required this.onAsk});

  final ValueChanged<String> onAsk;

  @override
  Widget build(BuildContext context) {
    return ListView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: const EdgeInsets.fromLTRB(20, 32, 20, 20),
      children: [
        const Center(child: AssistantAvatar(size: 72)),
        const SizedBox(height: 16),
        Text(
          'Sugeng rawuh!',
          textAlign: TextAlign.center,
          style: AppText.poppins(
            12,
            weight: FontWeight.w600,
            color: AppColors.gold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Ada yang bisa Tanya Krida bantu?',
          textAlign: TextAlign.center,
          style: AppText.playfair(22, height: 1.3),
        ),
        const SizedBox(height: 8),
        Text(
          'Tanyakan tentang Taman Krida Budaya, sejarah tari & kesenian Jawa '
          'Timur, jadwal pertunjukan, tiket, atau sewa gedung.',
          textAlign: TextAlign.center,
          style: AppText.poppins(13, color: AppColors.muted, height: 1.5),
        ),
        const SizedBox(height: 24),
        Text(
          'COBA TANYAKAN',
          style: AppText.poppins(
            11,
            weight: FontWeight.w600,
            color: AppColors.maroon,
          ),
        ),
        const SizedBox(height: 10),
        for (final question in AssistantScreen.starterQuestions) ...[
          _StarterTile(question: question, onTap: () => onAsk(question)),
          const SizedBox(height: 8),
        ],
        const SizedBox(height: 8),
        const _Disclaimer(),
      ],
    );
  }
}

class _StarterTile extends StatelessWidget {
  const _StarterTile({required this.question, required this.onTap});

  final String question;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.divider),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.chat_bubble_outline_rounded,
                size: 18,
                color: AppColors.maroon,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  question,
                  style: AppText.poppins(13, weight: FontWeight.w500),
                ),
              ),
              const Icon(
                Icons.north_east_rounded,
                size: 16,
                color: AppColors.muted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Pertanyaan lanjutan dari jawaban terakhir, bisa langsung diketuk.
class _SuggestionRow extends StatelessWidget {
  const _SuggestionRow({required this.suggestions, required this.onTap});

  final List<String> suggestions;
  final ValueChanged<String> onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
        itemCount: suggestions.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) => ActionChip(
          label: Text(suggestions[i]),
          labelStyle: AppText.poppins(
            12,
            weight: FontWeight.w500,
            color: AppColors.maroon,
          ),
          backgroundColor: AppColors.white,
          side: const BorderSide(color: AppColors.border),
          shape: const StadiumBorder(),
          onPressed: () => onTap(suggestions[i]),
        ),
      ),
    );
  }
}

/// Catatan etika: jawaban dibuat AI dan perlu dicek ulang untuk hal penting.
class _Disclaimer extends StatelessWidget {
  const _Disclaimer();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(
          Icons.info_outline_rounded,
          size: 14,
          color: AppColors.muted,
        ),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            'Jawaban dibuat AI dari data TKBJ. Periksa kembali info penting '
            'di halaman terkait.',
            textAlign: TextAlign.center,
            style: AppText.poppins(11, color: AppColors.muted, height: 1.4),
          ),
        ),
      ],
    );
  }
}
