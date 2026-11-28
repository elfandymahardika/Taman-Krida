import '../../core/constants/app_assets.dart';
import '../../core/utils/formatters.dart';
import '../../domain/entities/gallery_item.dart';
import 'json.dart';
import 'visuals.dart';

/// Koleksi arsip Virtual Galeri (GET /api/gallery).
class GalleryItemModel extends GalleryItem {
  const GalleryItemModel({
    required super.id,
    required super.title,
    required super.category,
    required super.badge,
    required super.headline,
    required super.description,
    required super.venue,
    required super.period,
    required super.photos,
    required super.videoMinutes,
    super.videos,
  });

  /// [all] = seluruh media: foto lain dalam koleksi yang sama ikut tampil
  /// sebagai album.
  factory GalleryItemModel.fromJson(Json m, List<Json> all) {
    final collection = m['collection'] as String;
    bool isVideo(Json x) => x['type'] == 'Video';
    final sameCollection = [
      for (final x in all)
        if (x['collection'] == collection) x,
    ];
    // Berkas video tidak bisa jadi gambar: sampul video = foto bawaan atau
    // foto lain dalam koleksi.
    String? photoOf(Json x) => isVideo(x)
        ? Visuals.photo(x['photo'] as String?)
        : Visuals.photo(x['url'] as String?) ??
              Visuals.photo(x['photo'] as String?);
    final photos = [
      for (final x in [m, ...sameCollection.where((x) => x != m)])
        if (!isVideo(x) || x == m) ?photoOf(x),
    ];
    final album = photos.isEmpty ? [AppImages.fasilitasGedung] : photos;
    final videos = [
      for (final x in [m, ...sameCollection.where((x) => x != m)])
        if (isVideo(x) && x['url'] is String) x['url'] as String,
    ];
    final date = DateTime.parse(m['date'] as String);
    final description = m['description'] as String? ?? '';
    final minutes = RegExp(r'(\d+)\.\d+')
        .firstMatch(m['dims'] as String? ?? '')
        ?.group(1);
    return GalleryItemModel(
      id: m['id'] as String,
      title: m['title'] as String,
      category: Visuals.galleryCategory('${m['title']} $collection'),
      badge: collection,
      headline: description.isEmpty ? 'Arsip $collection TKBJ.' : description,
      description: description.isEmpty
          ? 'Dokumentasi oleh ${m['credit']}.'
          : '$description Dokumentasi oleh ${m['credit']}.',
      venue: m['credit'] as String,
      period: Formatters.monthYear(date),
      photos: album,
      videoMinutes: isVideo(m) ? int.tryParse(minutes ?? '') ?? 1 : 0,
      videos: videos,
    );
  }
}
