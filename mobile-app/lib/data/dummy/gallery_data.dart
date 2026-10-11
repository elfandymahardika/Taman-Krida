import '../../core/constants/app_assets.dart';
import '../models/gallery_item.dart';

/// Koleksi Virtual Galeri (judul & kategori mengikuti desain Figma).
abstract final class GalleryData {
  static const categories = [
    'Semua',
    'Wayang',
    'Tari',
    'Ketoprak',
    'Fasilitas',
  ];

  static const items = <GalleryItem>[
    GalleryItem(
      id: 'wayang-semalam-suntuk',
      title: 'Seni Wayang Semalam Suntuk',
      category: 'Wayang',
      badge: 'Wayang Kulit',
      headline: 'Arsip pementasan wayang kulit di Panggung Terbuka TKBJ.',
      description:
          'Dokumentasi pagelaran wayang kulit lakon Bima Bungkus oleh '
          'Paguyuban Wahyu Budoyo, lengkap dengan iringan gamelan '
          'slendro-pelog.',
      venue: 'Panggung Terbuka',
      period: 'Juni 2026',
      photos: [
        AppImages.acaraWayang,
        AppImages.fasilitasPanggung,
        AppImages.gamelan,
        AppImages.fasilitasPendopo,
      ],
      videoMinutes: 12,
    ),
    GalleryItem(
      id: 'agung-tari-topeng',
      title: 'Agung Tari Topeng Malangan',
      category: 'Tari',
      badge: 'Tari Topeng',
      headline: 'Arsip pentas akbar tari topeng di Pendopo Agung TKBJ.',
      description:
          'Penampilan Sanggar Tari Mekar Sari membawakan tokoh Panji, Klana, '
          'dan Gunungsari dalam pentas akbar Tari Topeng Malangan.',
      venue: 'Pendopo Agung',
      period: 'Juni 2026',
      photos: [
        AppImages.acaraTopeng,
        AppImages.fasilitasPendopo,
        AppImages.latihanSanggar,
      ],
      videoMinutes: 9,
    ),
    GalleryItem(
      id: 'ketoprak-humor-kraton',
      title: 'Ketoprak Humor Kraton',
      category: 'Ketoprak',
      badge: 'Ketoprak',
      headline: 'Arsip ketoprak humor di Panggung Terbuka TKBJ.',
      description:
          "Komunitas Ketoprak 'Guyub Rukun' membawakan lakon Sang Adipati "
          'dengan dialog jenaka berbahasa Jawa.',
      venue: 'Panggung Terbuka',
      period: 'Juni 2026',
      photos: [AppImages.acaraKetoprak, AppImages.fasilitasPanggung],
      videoMinutes: 15,
    ),
    GalleryItem(
      id: 'atap-joglo-pendopo',
      title: 'Atap Joglo Pendopo Agung',
      category: 'Fasilitas',
      badge: 'Fasilitas',
      headline: 'Detail arsitektur joglo Pendopo Agung TKBJ.',
      description:
          'Pendopo Agung berarsitektur joglo limasan terbuka dengan empat '
          'soko guru, tempat utama pertunjukan tari kolosal dan wayang.',
      venue: 'Pendopo Agung',
      period: 'Mei 2026',
      photos: [
        AppImages.fasilitasPendopo,
        AppImages.fasilitasPanggung,
        AppImages.fasilitasGedung,
        AppImages.fasilitasParkir,
      ],
      videoMinutes: 4,
    ),
    GalleryItem(
      id: 'gamelan-slendro-pelog',
      title: 'Gamelan Slendro Pelog',
      category: 'Fasilitas',
      badge: 'Fasilitas',
      headline: 'Koleksi gamelan TKBJ untuk mengiringi pertunjukan.',
      description:
          'Seperangkat gamelan laras slendro dan pelog milik TKBJ yang dipakai '
          'untuk pagelaran wayang, tari, dan latihan sanggar.',
      venue: 'Gedung Kesenian',
      period: 'Mei 2026',
      photos: [AppImages.gamelan, AppImages.fasilitasGedung],
      videoMinutes: 6,
    ),
    GalleryItem(
      id: 'latihan-sanggar-muda',
      title: 'Latihan Rutin Sanggar Muda',
      category: 'Tari',
      badge: 'Tari Topeng',
      headline: 'Latihan rutin penari muda di Pendopo Agung TKBJ.',
      description:
          'Penari anak dan remaja berlatih tari topeng setiap Selasa dan '
          'Jumat sore bersama pelatih sanggar.',
      venue: 'Pendopo Agung',
      period: 'April 2026',
      photos: [
        AppImages.latihanSanggar,
        AppImages.acaraTopeng,
        AppImages.fasilitasPendopo,
      ],
      videoMinutes: 8,
    ),
  ];

  static GalleryItem byId(String id) =>
      items.firstWhere((item) => item.id == id);
}
