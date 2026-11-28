import 'package:flutter/foundation.dart';

import '../../core/error/failure.dart';
import '../../domain/entities/culture_topic.dart';
import '../../domain/usecases/culture_usecases.dart';
import 'catalog_controller.dart' show LoadState;

/// Materi Edukasi Budaya, dikelola admin di dashboard → Edukasi.
class EducationController extends ChangeNotifier {
  EducationController({required this._getTopics});

  final GetCultureTopicsUseCase _getTopics;

  static const all = 'Semua';

  LoadState loadState = LoadState.idle;
  String? error;
  List<CultureTopic> topics = const [];

  bool get isReady => loadState == LoadState.ready;

  /// Kategori chip filter mengikuti materi yang terbit, "Semua" di urutan
  /// pertama.
  List<String> get categories => [
    all,
    ...{for (final topic in topics) topic.category},
  ];

  /// [quiet]: materi lama tetap tampil selama memuat (tarik untuk segarkan),
  /// dan [Failure] diteruskan ke pemanggil bila server gagal dihubungi.
  Future<void> load({bool quiet = false}) async {
    final keepShowing = quiet && isReady;
    if (!keepShowing) {
      loadState = LoadState.loading;
      error = null;
      notifyListeners();
    }
    try {
      topics = await _getTopics();
      loadState = LoadState.ready;
    } on Failure catch (e) {
      if (keepShowing) rethrow;
      loadState = LoadState.error;
      error = e.message;
    }
    notifyListeners();
  }

  /// Tarik untuk segarkan. Mengembalikan pesan galat bila gagal.
  Future<String?> refresh() async {
    try {
      await load(quiet: true);
      return null;
    } on Failure catch (e) {
      return e.message;
    }
  }

  /// Muat bila belum pernah berhasil (mis. saat layar Edukasi dibuka).
  Future<void> ensureLoaded() async {
    if (loadState == LoadState.idle || loadState == LoadState.error) {
      await load();
    }
  }

  CultureTopic? topicById(String id) {
    for (final topic in topics) {
      if (topic.id == id) return topic;
    }
    return null;
  }

  /// Materi pada [category] ("Semua" = seluruh materi).
  List<CultureTopic> topicsIn(String category) => category == all
      ? topics
      : topics.where((t) => t.category == category).toList();
}
