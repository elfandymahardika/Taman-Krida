import '../../../../domain/entities/app_meta.dart';
import '../../../../domain/entities/news_item.dart';

/// Profil lembaga & konten beranda contoh (mode demo & test). Isinya sama
/// dengan data awal dashboard (backend/admin-dashboard/src/db/seeders/data.ts).
abstract final class HomeData {
  static const profile = InstitutionProfile(
    name: 'Taman Krida Budaya Jawa Timur',
    manager:
        'UPT LPPK Taman Krida Budaya · Dinas Kebudayaan dan Pariwisata '
        'Provinsi Jawa Timur',
    address:
        'Jl. Soekarno Hatta No. 7, Jatimulyo, Kec. Lowokwaru, Kota Malang, '
        'Jawa Timur 65141',
    phone: '(0341) 471509',
    whatsapp: '',
    hours: 'Senin–Jumat · 08.00–16.00 WIB (Sabtu–Minggu hanya saat ada acara)',
    about:
        'Kompleks seni budaya yang dikelola Disbudpar Jatim di Kota Malang '
        'seluas 17.050 m² (bangunan 4.103 m²) dengan pendopo beratap joglo, '
        'panggung terbuka, gedung pameran, dan mini museum. Rutin menggelar '
        'wayang, ketoprak, sendratari, reog, jaranan, bantengan, dan Topeng '
        'Panji. Masuk gratis.',
  );

  static final news = <NewsItem>[
    NewsItem(
      id: 'c1',
      title: 'Pekan Wayang Oktober di TKBJ',
      type: 'Banner beranda',
      summary: '',
      body:
          'Saksikan pagelaran wayang kulit, tari topeng, dan ketoprak setiap '
          'akhir pekan di Taman Krida Budaya Jawa Timur.',
      cta: 'Lihat agenda',
      link: '/agenda',
      isHero: true,
      updatedAt: DateTime(2026, 5, 30, 8, 40),
    ),
    NewsItem(
      id: 'c2',
      title: 'Jadwal pentas akhir pekan',
      type: 'Pengumuman',
      summary: 'Cek jadwal pentas Sabtu–Minggu di Kalender Acara.',
      body: '',
      updatedAt: DateTime(2026, 5, 29, 16, 15),
    ),
    NewsItem(
      id: 'c3',
      title: 'Mengenal Topeng Malangan dan tokoh Panji',
      type: 'Artikel budaya',
      summary: 'Kisah Panji dan makna warna topeng Malangan.',
      body: '',
      updatedAt: DateTime(2026, 5, 28, 11, 2),
    ),
  ];
}
