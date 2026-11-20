import 'package:flutter/foundation.dart';

import '../../domain/entities/culture_topic.dart';
import '../../domain/usecases/culture_usecases.dart';

/// Materi Edukasi Budaya (konten bawaan aplikasi).
class EducationController extends ChangeNotifier {
  EducationController({
    required GetCultureTopicsUseCase getTopics,
    required GetCultureCategoriesUseCase getCategories,
  }) : topics = getTopics(),
       categories = getCategories();

  final List<CultureTopic> topics;

  /// Kategori chip filter, "Semua" di urutan pertama.
  final List<String> categories;

  CultureTopic? topicById(String id) {
    for (final topic in topics) {
      if (topic.id == id) return topic;
    }
    return null;
  }

  /// Materi pada [category] ("Semua" = seluruh materi).
  List<CultureTopic> topicsIn(String category) => category == categories.first
      ? topics
      : topics.where((t) => t.category == category).toList();
}
