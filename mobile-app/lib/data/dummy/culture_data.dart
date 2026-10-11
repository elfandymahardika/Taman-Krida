import '../../core/constants/app_assets.dart';
import '../models/culture_topic.dart';

/// Materi Edukasi Budaya. Materi Wayang Kulit mengikuti desain Figma.
abstract final class CultureData {
  static const categories = ['Semua', 'Pertunjukan', 'Musik', 'Arsitektur'];

  static const topics = <CultureTopic>[
    CultureTopic(
      id: 'wayang-kulit',
      title: 'Wayang Kulit',
      category: 'Pertunjukan',
      summary: 'Kisah, tokoh, dan makna bayangan di balik kelir.',
      headline: 'Seni pertunjukan bayangan warisan budaya dunia dari Jawa.',
      readMinutes: 8,
      imageAsset: AppImages.acaraWayang,
      history:
          'Wayang kulit telah dikenal di Jawa sejak abad ke-10 dan berkembang '
          'menjadi media dakwah, pendidikan, dan hiburan. Di Jawa Timur, gaya '
          'Jawatimuran memiliki ciri sabetan tegas dan iringan gamelan yang '
          'dinamis.',
      timelineTitle: 'Linimasa',
      timeline: [
        TimelinePoint(
          '903 M',
          'Prasasti Balitung menyebut pertunjukan "mawayang" untuk upacara.',
        ),
        TimelinePoint(
          'Abad 15',
          'Wali Songo memakai wayang sebagai sarana dakwah.',
        ),
        TimelinePoint(
          '2003',
          'UNESCO menetapkan wayang sebagai Warisan Budaya Tak Benda.',
        ),
      ],
      philosophy: [
        PhilosophyPoint(
          '◆',
          'Kelir (layar putih)',
          'Melambangkan dunia tempat manusia menjalani kehidupan.',
        ),
        PhilosophyPoint(
          '☀',
          'Blencong (lampu)',
          'Sumber cahaya kehidupan; tanpa terang, bayangan tak tampak.',
        ),
        PhilosophyPoint(
          '▲',
          'Gunungan',
          'Simbol alam semesta, pembuka dan penutup setiap babak.',
        ),
        PhilosophyPoint(
          '●',
          'Dalang',
          'Pengatur jalannya cerita, cerminan kuasa Sang Pencipta.',
        ),
      ],
      photos: [
        AppImages.acaraWayang,
        AppImages.fasilitasPanggung,
        AppImages.gamelan,
        AppImages.fasilitasPendopo,
      ],
      videoMinutes: 12,
    ),
    CultureTopic(
      id: 'tari-topeng-malangan',
      title: 'Tari Topeng Malangan',
      category: 'Pertunjukan',
      summary: 'Karakter topeng Panji dan gerak khas Malang.',
      headline: 'Tari bertopeng khas Malang yang membawakan kisah Panji.',
      readMinutes: 6,
      imageAsset: AppImages.acaraTopeng,
      history:
          'Topeng Malangan berkembang di desa-desa sekitar Malang dan '
          'membawakan cerita Panji, kisah Raden Panji dan Dewi Sekartaji. '
          'Setiap topeng diukir dari kayu dan diwarnai sesuai watak tokohnya.',
      timelineTitle: 'Jejak Perkembangan',
      timeline: [
        TimelinePoint(
          'Asal',
          'Lakon utama bersumber dari cerita Panji era Kediri dan Majapahit.',
        ),
        TimelinePoint(
          'Pusat',
          'Dusun Kedungmonggo, Pakisaji, dikenal sebagai pusat latihan dan '
              'pembuatan topeng.',
        ),
        TimelinePoint(
          'Kini',
          'Tampil rutin di Pendopo Agung TKBJ dan festival budaya Malang.',
        ),
      ],
      philosophy: [
        PhilosophyPoint(
          '◆',
          'Warna topeng',
          'Merah melambangkan amarah; putih dan hijau melambangkan kesucian '
              'dan kebijaksanaan.',
        ),
        PhilosophyPoint(
          '▲',
          'Tokoh Panji',
          'Ksatria halus yang sabar dan rendah hati.',
        ),
        PhilosophyPoint(
          '●',
          'Tokoh Klana',
          'Gambaran raja yang dikuasai nafsu dan angkara murka.',
        ),
        PhilosophyPoint(
          '☀',
          'Gerak tari',
          'Gerak tegas dan dinamis mencerminkan watak masyarakat Malang.',
        ),
      ],
      photos: [
        AppImages.acaraTopeng,
        AppImages.latihanSanggar,
        AppImages.fasilitasPendopo,
        AppImages.gamelan,
      ],
      videoMinutes: 9,
    ),
    CultureTopic(
      id: 'ketoprak',
      title: 'Ketoprak',
      category: 'Pertunjukan',
      summary: 'Teater rakyat dengan cerita sejarah & humor.',
      headline: 'Teater tradisional Jawa yang memadukan cerita dan gamelan.',
      readMinutes: 5,
      imageAsset: AppImages.acaraKetoprak,
      history:
          'Ketoprak lahir sebagai hiburan rakyat di Jawa pada awal abad ke-20 '
          'dan menyebar ke Jawa Timur. Ceritanya diambil dari babad, legenda, '
          'dan kisah kerajaan, dibawakan dengan dialog berbahasa Jawa yang '
          'diselingi humor.',
      timelineTitle: 'Linimasa',
      timeline: [
        TimelinePoint(
          'Awal 1900-an',
          'Ketoprak lesung dimainkan petani dengan iringan bunyi lesung.',
        ),
        TimelinePoint(
          '1920-an',
          'Mulai diiringi gamelan dan tampil sebagai pertunjukan panggung.',
        ),
        TimelinePoint(
          'Kini',
          'Tampil di radio, televisi, dan Panggung Terbuka TKBJ.',
        ),
      ],
      philosophy: [
        PhilosophyPoint(
          '◆',
          'Cerita babad',
          'Menghidupkan sejarah agar mudah dipahami masyarakat.',
        ),
        PhilosophyPoint(
          '☀',
          'Humor',
          'Kritik sosial disampaikan lewat canda yang ringan.',
        ),
        PhilosophyPoint(
          '▲',
          'Bahasa Jawa',
          'Melestarikan tingkatan bahasa dan unggah-ungguh.',
        ),
        PhilosophyPoint(
          '●',
          'Gamelan',
          'Mengatur suasana dan pergantian adegan.',
        ),
      ],
      photos: [
        AppImages.acaraKetoprak,
        AppImages.fasilitasPanggung,
        AppImages.gamelan,
        AppImages.fasilitasGedung,
      ],
      videoMinutes: 15,
    ),
    CultureTopic(
      id: 'gamelan',
      title: 'Gamelan Slendro Pelog',
      category: 'Musik',
      summary: 'Dua laras utama dan perannya dalam pertunjukan.',
      headline: 'Ansambel musik tradisional Jawa dengan dua sistem nada.',
      readMinutes: 7,
      imageAsset: AppImages.gamelan,
      history:
          'Gamelan adalah ansambel yang terdiri dari gong, kenong, saron, '
          'bonang, kendang, dan instrumen lain. Laras slendro memakai lima nada '
          'dengan jarak hampir sama, sedangkan pelog memakai tujuh nada dengan '
          'jarak berbeda-beda.',
      timelineTitle: 'Linimasa',
      timeline: [
        TimelinePoint(
          'Abad 8',
          'Relief Candi Borobudur menggambarkan alat musik mirip gamelan.',
        ),
        TimelinePoint(
          'Keraton',
          'Gamelan berkembang sebagai musik upacara dan seni istana.',
        ),
        TimelinePoint(
          '2021',
          'UNESCO menetapkan gamelan sebagai Warisan Budaya Tak Benda.',
        ),
      ],
      philosophy: [
        PhilosophyPoint(
          '●',
          'Gong',
          'Penanda akhir siklus lagu, lambang keteraturan.',
        ),
        PhilosophyPoint(
          '◆',
          'Kendang',
          'Pengatur tempo, seperti pemimpin dalam masyarakat.',
        ),
        PhilosophyPoint('▲', 'Slendro', 'Bernuansa riang dan gagah.'),
        PhilosophyPoint('☀', 'Pelog', 'Bernuansa khidmat dan lembut.'),
      ],
      photos: [
        AppImages.gamelan,
        AppImages.fasilitasGedung,
        AppImages.acaraWayang,
        AppImages.fasilitasPendopo,
      ],
      videoMinutes: 6,
    ),
    CultureTopic(
      id: 'jaranan-reog',
      title: 'Jaranan & Reog',
      category: 'Pertunjukan',
      summary: 'Tari kuda lumping dan kesenian rakyat Jatim.',
      headline: 'Kesenian rakyat Jawa Timur dengan kuda anyaman dan barongan.',
      readMinutes: 6,
      imageAsset: AppImages.jaranan,
      history:
          'Jaranan dimainkan penari yang menunggang kuda tiruan dari anyaman '
          'bambu, diiringi kendang, gong, dan terompet. Reog dari Ponorogo '
          'menampilkan topeng barongan berhias bulu merak. Keduanya tumbuh '
          'sebagai kesenian rakyat di berbagai daerah Jawa Timur.',
      timelineTitle: 'Sebaran',
      timeline: [
        TimelinePoint(
          'Kediri',
          'Jaranan berkembang luas di Kediri, Tulungagung, dan Malang.',
        ),
        TimelinePoint('Ponorogo', 'Reog menjadi ikon kesenian Ponorogo.'),
        TimelinePoint(
          '2024',
          'UNESCO menetapkan Reog Ponorogo sebagai Warisan Budaya Tak Benda.',
        ),
      ],
      philosophy: [
        PhilosophyPoint(
          '▲',
          'Kuda kepang',
          'Simbol semangat dan keberanian prajurit.',
        ),
        PhilosophyPoint(
          '◆',
          'Barongan',
          'Kekuatan besar yang harus dikendalikan.',
        ),
        PhilosophyPoint(
          '●',
          'Kendang & gong',
          'Membangun irama yang menghentak.',
        ),
        PhilosophyPoint(
          '☀',
          'Kebersamaan',
          'Dimainkan beramai-ramai oleh warga desa.',
        ),
      ],
      photos: [
        AppImages.jaranan,
        AppImages.fasilitasPanggung,
        AppImages.gamelan,
        AppImages.fasilitasParkir,
      ],
      videoMinutes: 10,
    ),
    CultureTopic(
      id: 'arsitektur-joglo',
      title: 'Arsitektur Joglo',
      category: 'Arsitektur',
      summary: 'Filosofi atap Pendopo Agung TKBJ.',
      headline: 'Bangunan tradisional Jawa dengan atap tinggi dan soko guru.',
      readMinutes: 4,
      imageAsset: AppImages.fasilitasPendopo,
      history:
          'Joglo adalah bangunan tradisional Jawa dengan atap tinggi di bagian '
          'tengah yang ditopang empat tiang utama (soko guru). Pendopo Agung '
          'TKBJ memakai konsep ruang terbuka ini sehingga penonton dapat '
          'menyaksikan pertunjukan dari berbagai sisi.',
      timelineTitle: 'Bagian Rumah Joglo',
      timeline: [
        TimelinePoint(
          'Pendopo',
          'Bagian depan yang terbuka untuk menerima tamu dan pertunjukan.',
        ),
        TimelinePoint(
          'Pringgitan',
          'Ruang peralihan, tempat pertunjukan wayang digelar.',
        ),
        TimelinePoint('Dalem', 'Ruang keluarga dan bagian paling privat.'),
      ],
      philosophy: [
        PhilosophyPoint(
          '▲',
          'Atap tinggi',
          'Semakin tinggi, semakin dekat dengan Sang Pencipta.',
        ),
        PhilosophyPoint(
          '●',
          'Soko guru',
          'Empat tiang utama melambangkan empat arah mata angin.',
        ),
        PhilosophyPoint(
          '◆',
          'Ruang terbuka',
          'Keterbukaan dan keramahan kepada tamu.',
        ),
        PhilosophyPoint(
          '☀',
          'Tumpang sari',
          'Susunan balok bertingkat yang menopang atap.',
        ),
      ],
      photos: [
        AppImages.fasilitasPendopo,
        AppImages.fasilitasPanggung,
        AppImages.fasilitasGedung,
        AppImages.fasilitasParkir,
      ],
      videoMinutes: 4,
    ),
  ];

  static CultureTopic byId(String id) =>
      topics.firstWhere((topic) => topic.id == id);
}
