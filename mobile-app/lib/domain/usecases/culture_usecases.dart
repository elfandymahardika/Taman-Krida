import '../entities/culture_topic.dart';
import '../repositories/culture_repository.dart';

class GetCultureTopicsUseCase {
  const GetCultureTopicsUseCase(this._repository);

  final CultureRepository _repository;

  Future<List<CultureTopic>> call() => _repository.getTopics();
}
