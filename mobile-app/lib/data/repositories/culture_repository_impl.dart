import '../../domain/entities/culture_topic.dart';
import '../../domain/repositories/culture_repository.dart';
import '../datasources/local/culture_local_data_source.dart';

class CultureRepositoryImpl implements CultureRepository {
  const CultureRepositoryImpl(this._local);

  final CultureLocalDataSource _local;

  @override
  List<CultureTopic> getTopics() => _local.topics();

  @override
  List<String> getCategories() => _local.categories();
}
