import '../../../domain/entities/culture_topic.dart';
import '../../models/culture_topic_model.dart';
import '../../models/json.dart';
import 'api_client.dart';

/// Materi Edukasi Budaya. Melempar `ApiException` bila server gagal.
abstract interface class CultureRemoteDataSource {
  Future<List<CultureTopic>> cultureTopics();
}

/// Materi terpublikasi dari API mobile (backend/mobile-app), yang dikelola
/// admin di dashboard → Edukasi.
class CultureRemoteDataSourceImpl implements CultureRemoteDataSource {
  const CultureRemoteDataSourceImpl(this._api);

  final ApiClient _api;

  @override
  Future<List<CultureTopic>> cultureTopics() async {
    final list = await _api.get('/culture') as List;
    return list.cast<Json>().map(CultureTopicModel.fromJson).toList();
  }
}
