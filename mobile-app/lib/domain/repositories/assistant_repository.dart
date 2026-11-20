import '../entities/assistant_message.dart';

/// Kontrak Tanya Krida (asisten AI).
abstract interface class AssistantRepository {
  /// [history] = percakapan sejauh ini, pesan terakhir adalah pertanyaan
  /// pengguna. Mengembalikan jawaban asisten.
  Future<AssistantMessage> ask(List<AssistantMessage> history);
}
