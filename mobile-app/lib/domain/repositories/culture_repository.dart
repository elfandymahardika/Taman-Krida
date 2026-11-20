import '../entities/culture_topic.dart';

/// Kontrak materi Edukasi Budaya (konten bawaan aplikasi).
abstract interface class CultureRepository {
  List<CultureTopic> getTopics();

  /// Kategori untuk chip filter, "Semua" di urutan pertama.
  List<String> getCategories();
}
