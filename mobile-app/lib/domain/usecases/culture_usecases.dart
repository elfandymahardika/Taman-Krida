import '../entities/culture_topic.dart';
import '../repositories/culture_repository.dart';

class GetCultureTopicsUseCase {
  const GetCultureTopicsUseCase(this._repository);

  final CultureRepository _repository;

  List<CultureTopic> call() => _repository.getTopics();
}

class GetCultureCategoriesUseCase {
  const GetCultureCategoriesUseCase(this._repository);

  final CultureRepository _repository;

  List<String> call() => _repository.getCategories();
}
