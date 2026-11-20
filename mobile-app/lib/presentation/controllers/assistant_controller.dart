import 'package:flutter/foundation.dart';

import '../../core/error/failure.dart';
import '../../domain/entities/assistant_message.dart';
import '../../domain/usecases/assistant_usecases.dart' as rules;
import '../../domain/usecases/assistant_usecases.dart';

/// Percakapan Tanya Krida. Disimpan selama aplikasi berjalan, jadi tetap ada
/// saat pengguna membuka layar lain lewat tombol jawaban lalu kembali.
class AssistantController extends ChangeNotifier {
  AssistantController({required this._askAssistant});

  final AskAssistantUseCase _askAssistant;

  /// Panjang maksimal pertanyaan (sama dengan batas server).
  static const maxLength = rules.assistantMaxLength;

  List<AssistantMessage> _messages = [];

  List<AssistantMessage> get messages => List.unmodifiable(_messages);

  /// Sedang menunggu jawaban asisten.
  bool busy = false;

  /// Kirim pertanyaan lalu tambahkan jawaban (atau pesan gagal) ke percakapan.
  Future<void> ask(String question) async {
    final text = question.trim();
    if (text.isEmpty || busy) return;
    _messages = [
      // Pesan gagal sebelumnya tidak perlu tetap tampil setelah bertanya lagi.
      ..._messages.where((m) => !m.isError),
      AssistantMessage.user(text),
    ];
    busy = true;
    notifyListeners();
    AssistantMessage answer;
    try {
      answer = await _askAssistant(_messages);
    } on Failure catch (e) {
      answer = AssistantMessage(
        role: ChatRole.assistant,
        text: e.message,
        isError: true,
      );
    }
    _messages = [..._messages, answer];
    busy = false;
    notifyListeners();
  }

  /// Ulangi pertanyaan terakhir setelah jawaban gagal.
  Future<void> retry() async {
    final lastQuestion = _messages.lastWhere(
      (m) => m.isUser,
      orElse: () => const AssistantMessage.user(''),
    );
    if (lastQuestion.text.isEmpty) return;
    // Pertanyaan yang sama dikirim ulang (bukan ditambah dua kali).
    _messages = _messages.sublist(0, _messages.lastIndexOf(lastQuestion));
    await ask(lastQuestion.text);
  }

  void clear() {
    if (busy) return;
    _messages = [];
    notifyListeners();
  }
}
