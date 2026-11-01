import 'dart:ui';

import '../../core/constants/app_assets.dart';

/// Tata letak denah untuk satu fasilitas (tidak disimpan di server).
class FacilityLayout {
  const FacilityLayout({
    required this.number,
    required this.shortName,
    required this.description,
    required this.imageAsset,
    required this.mapPosition,
  });

  final int number;
  final String shortName;
  final String description;
  final String imageAsset;
  final Offset mapPosition;
}

/// Aset visual aplikasi untuk data dari server. Server hanya mengirim kunci
/// foto (`wayang`, `topeng`, `ketoprak`) atau URL foto unggahan admin.
abstract final class Visuals {
  /// Kunci `id` fasilitas di dashboard → posisi pin & foto denah.
  static const facilityLayouts = {
    'pendopo': FacilityLayout(
      number: 1,
      shortName: 'Pendopo Agung',
      description:
          'Bangunan utama berarsitektur joglo limasan terbuka untuk '
          'pertunjukan tari kolosal & wayang.',
      imageAsset: AppImages.fasilitasPendopo,
      mapPosition: Offset(0.198, 0.254),
    ),
    'panggung': FacilityLayout(
      number: 2,
      shortName: 'Panggung Terbuka',
      description:
          'Amfiteater ruang terbuka bernuansa alam untuk pertunjukan '
          'sendratari kolosal & festival.',
      imageAsset: AppImages.fasilitasPanggung,
      mapPosition: Offset(0.534, 0.213),
    ),
    'galeri': FacilityLayout(
      number: 3,
      shortName: 'Gedung Kesenian',
      description:
          'Ruang pameran seni rupa indoor modern, lokakarya kriya, dan '
          'pameran tertutup.',
      imageAsset: AppImages.fasilitasGedung,
      mapPosition: Offset(0.673, 0.629),
    ),
    'loket': FacilityLayout(
      number: 4,
      shortName: 'Area Parkir',
      description:
          'Fasilitas parkir luas terkendali, area loket terintegrasi, '
          'toilet, serta mushola.',
      imageAsset: AppImages.fasilitasParkir,
      mapPosition: Offset(0.254, 0.713),
    ),
  };

  /// Kunci foto / URL dari server → path aset atau URL untuk ArtworkImage.
  static String? photo(String? key) {
    if (key == null || key.isEmpty) return null;
    if (key.startsWith('http')) return key;
    return switch (key) {
      'wayang' => AppImages.acaraWayang,
      'topeng' => AppImages.acaraTopeng,
      'ketoprak' => AppImages.acaraKetoprak,
      _ => null,
    };
  }

  /// Foto bawaan sebuah venue (dipakai bila acara tidak punya foto).
  static String venueImage(String venue) {
    final name = venue.toLowerCase();
    if (name.contains('pendopo')) return AppImages.fasilitasPendopo;
    if (name.contains('panggung')) return AppImages.fasilitasPanggung;
    if (name.contains('galeri') || name.contains('gedung')) {
      return AppImages.fasilitasGedung;
    }
    return AppImages.fasilitasParkir;
  }

  /// "Panggung Terbuka" → "Terbuka", "Pendopo Agung TKBJ" → "Pendopo".
  static String venueShort(String venue) {
    final name = venue.toLowerCase();
    if (name.contains('pendopo')) return 'Pendopo';
    if (name.contains('panggung')) return 'Terbuka';
    if (name.contains('galeri') || name.contains('gedung')) {
      return 'Gedung Kesenian';
    }
    return venue;
  }

  /// Kategori chip galeri ditebak dari judul & koleksi media.
  static String galleryCategory(String text) {
    final t = text.toLowerCase();
    if (t.contains('wayang')) return 'Wayang';
    if (RegExp('tari|topeng|reog|remo|jaranan').hasMatch(t)) return 'Tari';
    if (RegExp('ketoprak|ludruk|teater').hasMatch(t)) return 'Ketoprak';
    if (RegExp('panggung|pendopo|gedung|fasilitas|kostum').hasMatch(t)) {
      return 'Fasilitas';
    }
    return 'Lainnya';
  }
}
