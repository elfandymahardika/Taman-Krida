import '../../domain/entities/culture_topic.dart';
import '../../domain/repositories/culture_repository.dart';
import '../datasources/remote/culture_remote_data_source.dart';
import 'guard.dart';

class CultureRepositoryImpl implements CultureRepository {
  const CultureRepositoryImpl(this._remote);

  final CultureRemoteDataSource _remote;

  @override
  Future<List<CultureTopic>> getTopics() => guard(_remote.cultureTopics);
}
