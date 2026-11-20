import '../../../domain/entities/assistant_message.dart';
import '../../models/assistant_message_model.dart';
import '../../models/json.dart';
import 'api_client.dart';

/// Sumber data Tanya Krida (asisten AI).
abstract interface class AssistantRemoteDataSource {
  Future<AssistantMessage> askAssistant(List<AssistantMessage> history);
}

class AssistantRemoteDataSourceImpl implements AssistantRemoteDataSource {
  AssistantRemoteDataSourceImpl(this._api);

  final ApiClient _api;

  /// Jawaban AI bisa memerlukan beberapa kali pencarian data di server.
  static const _timeout = Duration(seconds: 90);

  @override
  Future<AssistantMessage> askAssistant(List<AssistantMessage> history) async =>
      AssistantMessageModel.fromJson(
        await _api.post(
          '/assistant/chat',
          AssistantMessageModel.historyJson(history),
          _timeout,
        ) as Json,
      );
}
