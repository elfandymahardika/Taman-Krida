/// Koleksi arsip pada Virtual Galeri.
class GalleryItem {
  const GalleryItem({
    required this.id,
    required this.title,
    required this.category,
    required this.badge,
    required this.headline,
    required this.description,
    required this.venue,
    required this.period,
    required this.photos,
    required this.videoMinutes,
  });

  final String id;
  final String title;

  /// Kategori untuk chip filter: Wayang, Tari, Ketoprak, Fasilitas.
  final String category;

  /// Label kecil pada kartu, mis. "Wayang Kulit".
  final String badge;

  /// Deskripsi singkat di header detail.
  final String headline;
  final String description;
  final String venue;
  final String period;

  /// Path foto. Foto pertama menjadi sampul kartu.
  final List<String> photos;
  final int videoMinutes;

  String get cover => photos.first;
}
