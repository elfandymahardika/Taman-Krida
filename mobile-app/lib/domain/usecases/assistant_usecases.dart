import '../entities/assistant_message.dart';
import '../repositories/assistant_repository.dart';

/// Panjang maksimal pertanyaan (sama dengan batas server).
const assistantMaxLength = 500;

/// Bertanya ke Tanya Krida. Pesan gagal sebelumnya tidak ikut dikirim
/// sebagai riwayat percakapan.
class AskAssistantUseCase {
  const AskAssistantUseCase(this._repository);

  final AssistantRepository _repository;

  Future<AssistantMessage> call(List<AssistantMessage> history) =>
      _repository.ask([
        for (final m in history)
          if (!m.isError) m,
      ]);
}
