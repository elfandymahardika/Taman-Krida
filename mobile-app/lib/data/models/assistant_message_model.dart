import '../../domain/entities/assistant_message.dart';
import 'json.dart';

/// Jawaban Tanya Krida dari POST /api/assistant/chat.
class AssistantMessageModel extends AssistantMessage {
  const AssistantMessageModel({
    required super.role,
    required super.text,
    super.links,
    super.suggestions,
  });

  factory AssistantMessageModel.fromJson(Json json) => AssistantMessageModel(
    role: ChatRole.assistant,
    text: json['reply'] as String,
    links: [
      for (final l in (json['links'] as List? ?? const []).cast<Json>())
        if (AssistantLinkKind.fromApi(l['kind'] as String?) case final kind?)
          AssistantLink(
            kind: kind,
            label: l['label'] as String,
            id: l['id'] as String?,
          ),
    ],
    suggestions: (json['suggestions'] as List? ?? const []).cast<String>(),
  );

  /// Body permintaan: riwayat percakapan dalam format API.
  static Json historyJson(List<AssistantMessage> history) => {
    'messages': [
      for (final m in history)
        {'role': m.isUser ? 'user' : 'assistant', 'content': m.text},
    ],
  };
}
