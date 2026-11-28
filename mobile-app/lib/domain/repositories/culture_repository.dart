import '../entities/culture_topic.dart';

/// Kontrak materi Edukasi Budaya (dikelola admin, dibaca dari server).
abstract interface class CultureRepository {
  /// Materi terpublikasi sesuai urutan tampil.
  Future<List<CultureTopic>> getTopics();
}
