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

/// Cara video materi ditampilkan.
enum CultureVideoType {
  /// Berkas video (unggahan admin / tautan langsung .mp4): diputar di aplikasi.
  file,

  /// Tautan YouTube: dibuka di aplikasi YouTube.
  youtube,

  /// Tautan lain: dibuka di browser.
  link,
}

/// Video dokumenter materi, diatur admin di dashboard.
class CultureVideo {
  const CultureVideo(this.url, this.type);

  final String url;
  final CultureVideoType type;

  /// Diputar langsung di aplikasi (bukan dibuka di aplikasi lain).
  bool get playsInApp => type == CultureVideoType.file;
}

/// Materi Edukasi Budaya (dikelola admin di dashboard → Edukasi).
class CultureTopic {
  const CultureTopic({
    required this.id,
    required this.title,
    required this.category,
    required this.summary,
    required this.headline,
    required this.readMinutes,
    required this.history,
    required this.timelineTitle,
    required this.timeline,
    required this.philosophy,
    required this.photos,
    required this.videoMinutes,
    this.video,
  });

  final String id;
  final String title;

  /// Mis. Pertunjukan, Musik, Arsitektur (kategori diatur admin).
  final String category;

  /// Kalimat singkat di kartu materi.
  final String summary;

  /// Kalimat di header halaman detail.
  final String headline;
  final int readMinutes;
  final String history;
  final String timelineTitle;
  final List<TimelinePoint> timeline;
  final List<PhilosophyPoint> philosophy;

  /// Path aset atau URL foto; foto pertama = sampul. Boleh kosong.
  final List<String> photos;

  /// Durasi video (keterangan saja); 0 = tidak ditampilkan.
  final int videoMinutes;

  /// Video dokumenter; null = materi tanpa video.
  final CultureVideo? video;

  /// Sampul kartu & halaman detail ('' = sampul polos).
  String get imageAsset => photos.isEmpty ? '' : photos.first;
}
