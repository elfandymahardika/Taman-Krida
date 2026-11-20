import '../../domain/entities/assistant_message.dart';
import '../../domain/repositories/assistant_repository.dart';
import '../datasources/remote/assistant_remote_data_source.dart';
import 'guard.dart';

class AssistantRepositoryImpl implements AssistantRepository {
  const AssistantRepositoryImpl(this._remote);

  final AssistantRemoteDataSource _remote;

  @override
  Future<AssistantMessage> ask(List<AssistantMessage> history) =>
      guard(() => _remote.askAssistant(history));
}
