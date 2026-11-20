import '../../../../core/constants/app_assets.dart';
import '../../../../domain/entities/community.dart';

/// Direktori komunitas: sanggar/padepokan Malang Raya yang nyata, sama dengan
/// komunitas Aktif di seeder dashboard (backend/admin-dashboard/src/db/seeders/data.ts).
///
/// Sumber: TIMES Indonesia, RRI Malang, jurnal Harmonia UNNES, Wikipedia
/// "Topeng Malangan". Data yang tidak dipublikasikan (jumlah anggota, jumlah
/// pentas, jadwal latihan, nomor sanggar) sengaja dikosongkan: anggota 0 dan
/// pentas '–' ditampilkan "–", jadwal kosong ditampilkan "Hubungi pengurus",
/// dan kontak diarahkan ke kantor pengelola TKBJ.
abstract final class CommunityData {
  static const filters = ['Semua', 'Tari', 'Wayang', 'Ketoprak', 'Jaranan'];

  /// Kategori yang bisa dipilih saat mendaftarkan komunitas.
  static const registerCategories = ['Tari', 'Wayang', 'Ketoprak', 'Jaranan'];

  /// Kantor pengelola TKBJ (UPT Taman Budaya), dipakai karena nomor sanggar
  /// belum dipublikasikan.
  static const _viaTkbj = '(0341) 471509';

  static const communities = <Community>[
    Community(
      id: 'asmorobangun',
      name: 'Padepokan Seni Topeng Asmorobangun',
      category: 'Tari',
      specialization: 'Tari & Wayang Topeng Malangan',
      phone: _viaTkbj,
      imageAsset: AppImages.acaraTopeng,
      headline:
          'Padepokan topeng Malangan sejak awal 1900-an, penerus tradisi maestro '
          'Mbah Karimun di Dusun Kedungmonggo.',
      foundedYear: 0,
      members: 0,
      performances: '–',
      about:
          'Padepokan Asmorobangun melestarikan tari dan wayang topeng Malangan '
          'sejak awal abad ke-20. Kini dipimpin Tri Handoyo, cucu maestro '
          'topeng Mbah Karimun, yang juga mengajar tari dan pembuatan topeng.',
      schedule: [],
      place: 'Padepokan Asmorobangun, Kedungmonggo',
      leader: 'Tri Handoyo',
      address: 'Dusun Kedungmonggo, Kec. Pakisaji, Kab. Malang',
    ),
    Community(
      id: 'mangun-dharmo',
      name: 'Padepokan Seni Mangun Dharmo',
      category: 'Wayang',
      specialization: 'Wayang Topeng, Pedalangan & Karawitan',
      phone: _viaTkbj,
      imageAsset: AppImages.acaraWayang,
      headline:
          'Padepokan seni di kaki Pegunungan Tengger yang mengajarkan wayang '
          'topeng, pedalangan, dan karawitan.',
      foundedYear: 1989,
      members: 0,
      performances: '–',
      about:
          'Didirikan Ki Soleh Adi Pramono pada 1989, Mangun Dharmo menjadi '
          'tempat belajar tari, pedalangan, sinden, karawitan, macapat '
          'Malangan, dan ukir topeng Malang.',
      schedule: [],
      place: 'Padepokan Mangun Dharmo, Tulus Besar',
      leader: 'Ki Soleh Adi Pramono',
      address: 'Desa Tulus Besar, Kec. Tumpang, Kab. Malang',
    ),
    Community(
      id: 'mantraloka',
      name: 'Sanggar Mantraloka',
      category: 'Wayang',
      specialization: 'Wayang Topeng Jabung',
      phone: _viaTkbj,
      imageAsset: AppImages.acaraWayang,
      headline:
          'Sanggar yang menghidupkan kembali wayang topeng Jabung setelah '
          'para sesepuhnya wafat.',
      foundedYear: 2018,
      members: 0,
      performances: '–',
      about:
          'Mantraloka berdiri pada 2018 di Kemantren, Jabung, sebagai upaya '
          'membangkitkan tradisi wayang topeng Jabung, dan tampil di '
          'pagelaran Topeng Malangan Taman Krida Budaya.',
      schedule: [],
      place: 'Kemantren, Jabung',
      leader: '–',
      address: 'Desa Kemantren, Kec. Jabung, Kab. Malang',
    ),
    Community(
      id: 'setyotomo',
      name: 'Sanggar Setyotomo',
      category: 'Tari',
      specialization: 'Tari Topeng Malangan',
      phone: _viaTkbj,
      imageAsset: AppImages.acaraTopeng,
      headline: 'Sanggar topeng Malangan dari Glagah Dowo, Tumpang.',
      foundedYear: 0,
      members: 0,
      performances: '–',
      about:
          'Setyotomo adalah kelompok topeng Malangan di Glagah Dowo, Tumpang, '
          'pimpinan Budi Utomo, yang tampil di Kembul Topeng dan pagelaran '
          'Topeng Malangan Taman Krida Budaya.',
      schedule: [],
      place: 'Glagah Dowo, Tumpang',
      leader: 'Budi Utomo',
      address: 'Dusun Glagah Dowo, Kec. Tumpang, Kab. Malang',
    ),
  ];

  static Community byId(String id) =>
      communities.firstWhere((community) => community.id == id);
}
