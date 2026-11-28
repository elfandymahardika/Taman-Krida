/// Konten dari dashboard (menu Konten): banner beranda, berita, pengumuman,
/// atau artikel budaya. Hanya yang terpublikasi yang dikirim server.
class NewsItem {
  const NewsItem({
    required this.id,
    required this.title,
    required this.type,
    required this.summary,
    required this.body,
    required this.updatedAt,
    this.cta,
    this.link,
    this.isHero = false,
  });

  final String id;
  final String title;

  /// Banner beranda, Berita, Pengumuman, atau Artikel budaya.
  final String type;
  final String summary;
  final String body;
  final DateTime updatedAt;

  /// Teks tombol & tujuan tautan (halaman aplikasi "/..." atau "https://").
  final String? cta;
  final String? link;

  /// Banner utama beranda.
  final bool isHero;

  bool get isBanner => type == 'Banner beranda';
}
