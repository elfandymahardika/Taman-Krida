/// Satu poin pada linimasa sejarah.
class TimelinePoint {
  const TimelinePoint(this.label, this.text);

  final String label;
  final String text;
}

/// Satu makna/simbol pada tab Filosofi.
class PhilosophyPoint {
  const PhilosophyPoint(this.symbol, this.title, this.text);

  final String symbol;
  final String title;
  final String text;
}

/// Materi Edukasi Budaya.
class CultureTopic {
  const CultureTopic({
    required this.id,
    required this.title,
    required this.category,
    required this.summary,
    required this.headline,
    required this.readMinutes,
    required this.imageAsset,
    required this.history,
    required this.timelineTitle,
    required this.timeline,
    required this.philosophy,
    required this.photos,
    required this.videoMinutes,
  });

  final String id;
  final String title;

  /// Pertunjukan, Musik, atau Arsitektur.
  final String category;

  /// Kalimat singkat di kartu materi.
  final String summary;

  /// Kalimat di header halaman detail.
  final String headline;
  final int readMinutes;
  final String imageAsset;
  final String history;
  final String timelineTitle;
  final List<TimelinePoint> timeline;
  final List<PhilosophyPoint> philosophy;
  final List<String> photos;
  final int videoMinutes;
}
