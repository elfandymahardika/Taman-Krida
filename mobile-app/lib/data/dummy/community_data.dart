import '../../core/constants/app_assets.dart';
import '../models/community.dart';

/// Direktori komunitas (nama, spesialisasi & nomor mengikuti desain Figma).
abstract final class CommunityData {
  static const filters = ['Semua', 'Tari', 'Wayang', 'Ketoprak', 'Jaranan'];

  /// Kategori yang bisa dipilih saat mendaftarkan komunitas.
  static const registerCategories = ['Tari', 'Wayang', 'Ketoprak', 'Jaranan'];

  static const communities = <Community>[
    Community(
      id: 'mekar-sari',
      name: 'Sanggar Tari Mekar Sari',
      category: 'Tari',
      specialization: 'Tari Topeng Malangan',
      phone: '0812-3456-7890',
      imageAsset: AppImages.acaraTopeng,
      headline:
          'Sanggar tari tradisional Malang yang aktif melestarikan Tari '
          'Topeng Malangan.',
      foundedYear: 1998,
      members: 45,
      performances: '120+',
      about:
          'Didirikan oleh keluarga seniman topeng Kedungmonggo, Sanggar Mekar '
          'Sari membina penari anak hingga dewasa dan rutin tampil di Pendopo '
          'Agung TKBJ.',
      schedule: [
        ('Selasa & Jumat', '15:00 – 17:30 WIB'),
        ('Minggu', '08:00 – 11:00 WIB'),
      ],
      place: 'Pendopo Agung TKBJ',
      leader: 'Ibu Sri Wahyuni',
      address: 'Jl. Soekarno-Hatta No. 7',
    ),
    Community(
      id: 'wahyu-budoyo',
      name: "Paguyuban Wayang 'Wahyu Budoyo'",
      category: 'Wayang',
      specialization: 'Wayang Kulit & Karawitan',
      phone: '0813-2233-4455',
      imageAsset: AppImages.acaraWayang,
      headline:
          'Paguyuban dalang dan pengrawit yang menggelar wayang kulit '
          'semalam suntuk.',
      foundedYear: 1987,
      members: 30,
      performances: '200+',
      about:
          'Paguyuban Wahyu Budoyo dipimpin Dalang Ki Sutejo dan rutin menggelar '
          'wayang kulit gaya Jawatimuran, sekaligus membuka kelas karawitan '
          'untuk umum.',
      schedule: [('Sabtu', '19:00 – 22:00 WIB'), ('Rabu', '16:00 – 18:00 WIB')],
      place: 'Panggung Terbuka TKBJ',
      leader: 'Ki Sutejo',
      address: 'Kec. Lowokwaru, Kota Malang',
    ),
    Community(
      id: 'guyub-rukun',
      name: "Komunitas Ketoprak 'Guyub Rukun'",
      category: 'Ketoprak',
      specialization: 'Ketoprak Kontemporer',
      phone: '0857-1122-3344',
      imageAsset: AppImages.acaraKetoprak,
      headline:
          'Komunitas teater rakyat yang memadukan ketoprak klasik dengan '
          'humor masa kini.',
      foundedYear: 2005,
      members: 28,
      performances: '80+',
      about:
          'Guyub Rukun mengangkat cerita babad dan legenda Jawa Timur dengan '
          'gaya kontemporer, dan sering tampil di Panggung Terbuka TKBJ.',
      schedule: [
        ('Rabu', '19:00 – 21:30 WIB'),
        ('Minggu', '15:00 – 17:00 WIB'),
      ],
      place: 'Gedung Kesenian TKBJ',
      leader: 'Bapak Joko Santoso',
      address: 'Kec. Klojen, Kota Malang',
    ),
    Community(
      id: 'turonggo-putro',
      name: "Jaranan Dor 'Turonggo Putro'",
      category: 'Jaranan',
      specialization: 'Kesenian Reog Malang',
      phone: '0822-9988-7766',
      imageAsset: AppImages.jaranan,
      headline:
          'Kelompok jaranan dor yang menghidupkan kesenian rakyat Malang.',
      foundedYear: 2010,
      members: 40,
      performances: '150+',
      about:
          'Turonggo Putro menampilkan jaranan dor dan reog Malang dengan '
          'iringan kendang, gong, dan terompet di berbagai acara desa.',
      schedule: [('Jumat', '19:00 – 22:00 WIB')],
      place: 'Lapangan Desa Tumpang',
      leader: 'Bapak Slamet Riyadi',
      address: 'Kec. Tumpang, Kab. Malang',
    ),
  ];

  static Community byId(String id) =>
      communities.firstWhere((community) => community.id == id);
}
