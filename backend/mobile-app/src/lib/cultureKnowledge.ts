/*
 * Basis pengetahuan budaya untuk Tanya Krida (alat `materi_budaya`).
 *
 * - Entri yang punya `idMateri` SAMA dengan id materi Edukasi Budaya (tabel `culture_topics`, dikelola admin di
 *   dashboard → Edukasi). Saat dipakai, isinya ditimpa isi materi terbaru dari database dan tombol "Baca materi"
 *   hanya muncul bila materinya terpublikasi (lihat cultureEntries() di assistantTools.ts). Materi baru dari
 *   dashboard otomatis ikut dikenali walau tidak punya entri di sini.
 * - Entri lain adalah ringkasan umum kesenian Jawa Timur. Isinya sengaja ringkas dan hanya memuat fakta yang
 *   umum dikenal; tambahkan/perbaiki bersama pengelola TKBJ bila ada sumber resmi.
 * - Fakta TKBJ di entri 'tkbj' bersumber dari Wikipedia, berita TIMES Indonesia/Radar Malang/ANTARA (2026). Tanggal
 *   pendirian kompleks belum dicantumkan karena belum terverifikasi. Isi
 *   `sejarah` pada entri 'tkbj' bila sudah ada sumber resmi (mis. dari Dinas Kebudayaan Jatim).
 */

export interface CultureEntry {
  /** Id unik entri. */
  id: string;
  /** Id materi Edukasi Budaya di aplikasi (untuk tombol "Baca materi"), bila ada. */
  idMateri?: string;
  judul: string;
  /** Mis. 'Tentang TKBJ', 'Tari', 'Teater', 'Pertunjukan', 'Musik', 'Arsitektur' (materi dashboard: kategori bebas). */
  kategori: string;
  /** Kata yang dipakai untuk mencocokkan pertanyaan (huruf kecil). */
  kataKunci: string[];
  ringkasan: string;
  sejarah: string;
  linimasa?: string[];
  makna?: string[];
}

export const CULTURE_ENTRIES: CultureEntry[] = [
  {
    id: 'tkbj',
    judul: 'Taman Krida Budaya Jawa Timur (TKBJ)',
    kategori: 'Tentang TKBJ',
    kataKunci: ['tkbj', 'taman krida', 'krida budaya'],
    ringkasan:
      'Kompleks seni budaya di Jl. Soekarno Hatta No. 7, Jatimulyo, Lowokwaru, Kota Malang, dikelola UPT LPPK Taman ' +
      'Krida Budaya di bawah Disbudpar Provinsi Jawa Timur. Masuk gratis.',
    sejarah:
      'TKBJ berdiri di atas lahan 17.050 m² dengan luas bangunan 4.103 m². Gerbangnya bergaya candi dan pendoponya ' +
      'beratap joglo dengan bagian luar dan dalam, sehingga pertunjukan dapat disaksikan dari berbagai sisi. Selain ' +
      'pendopo terdapat panggung terbuka, gedung pameran, mini museum, mushola, dan area parkir. Sejak Februari 2025 ' +
      'Disbudpar Jatim kembali menggelar pagelaran rutin Topeng Panji/Topeng Malangan di TKBJ secara gratis. ' +
      'Tanggal pendirian kompleks belum tersedia di data aplikasi.',
    linimasa: [
      '21 Februari 2026: Tari Topeng Malangan "Love Hunt for You – Dewi Ragil Kuning" bersama sanggar-sanggar Malang Raya.',
      '25 April 2026: Topeng Panji "Candrasmara" oleh STKW Surabaya, gratis, mulai 18.00 WIB.',
      '30 Juni–5 Juli 2026: festival Malang Djadoel 3 (reog, bantengan, jaranan, topeng, wayang suket, bazar antik).',
      '16 Oktober 2026: Sendratari Ramayana "Sotya Chapter: Shinta Ilang" memperingati Hari Jadi ke-81 Jawa Timur.',
      '7 November 2026: pagelaran wayang puncak Hari Wayang Nasional, gratis.',
    ],
    makna: [
      'Pendopo Agung TKBJ: pertunjukan tradisi seperti wayang, karawitan, dan Topeng Panji.',
      'Panggung Terbuka: pentas luar ruang seperti sendratari, reog, jaranan, dan bantengan.',
      'Gedung Kesenian & Galeri: pameran batik, kriya, seni rupa, dan fotografi, serta mini museum.',
      'Jam kantor Senin–Jumat 08.00–16.00 WIB; Sabtu–Minggu hanya dibuka saat ada acara. Telepon (0341) 471509.',
    ],
  },
  {
    id: 'wayang-kulit',
    idMateri: 'wayang-kulit',
    judul: 'Wayang Kulit',
    kategori: 'Pertunjukan',
    kataKunci: ['wayang', 'dalang', 'kelir', 'gunungan', 'blencong'],
    ringkasan: 'Seni pertunjukan bayangan warisan budaya dunia dari Jawa.',
    sejarah:
      'Wayang kulit telah dikenal di Jawa sejak abad ke-10 dan berkembang menjadi media dakwah, pendidikan, dan ' +
      'hiburan. Di Jawa Timur, gaya Jawatimuran memiliki ciri sabetan tegas dan iringan gamelan yang dinamis.',
    linimasa: [
      '903 M: Prasasti Balitung menyebut pertunjukan "mawayang" untuk upacara.',
      'Abad 15: Wali Songo memakai wayang sebagai sarana dakwah.',
      '2003: UNESCO menetapkan wayang sebagai Warisan Budaya Tak Benda.',
    ],
    makna: [
      'Kelir (layar putih): dunia tempat manusia menjalani kehidupan.',
      'Blencong (lampu): sumber cahaya kehidupan; tanpa terang, bayangan tak tampak.',
      'Gunungan: simbol alam semesta, pembuka dan penutup setiap babak.',
      'Dalang: pengatur jalannya cerita, cerminan kuasa Sang Pencipta.',
    ],
  },
  {
    id: 'tari-topeng-malangan',
    idMateri: 'tari-topeng-malangan',
    judul: 'Tari Topeng Malangan',
    kategori: 'Tari',
    kataKunci: ['topeng', 'malangan', 'panji', 'klana', 'sekartaji', 'kedungmonggo'],
    ringkasan: 'Tari bertopeng khas Malang yang membawakan kisah Panji.',
    sejarah:
      'Topeng Malangan berkembang di desa-desa sekitar Malang dan membawakan cerita Panji, kisah Raden Panji dan ' +
      'Dewi Sekartaji. Setiap topeng diukir dari kayu dan diwarnai sesuai watak tokohnya.',
    linimasa: [
      'Asal: lakon utama bersumber dari cerita Panji era Kediri dan Majapahit.',
      'Pusat: Dusun Kedungmonggo, Pakisaji, dikenal sebagai pusat latihan dan pembuatan topeng.',
      'Kini: tampil rutin di Pendopo Agung TKBJ dan festival budaya Malang.',
    ],
    makna: [
      'Warna topeng: merah melambangkan amarah; putih dan hijau melambangkan kesucian dan kebijaksanaan.',
      'Tokoh Panji: ksatria halus yang sabar dan rendah hati.',
      'Tokoh Klana: raja yang dikuasai nafsu dan angkara murka.',
      'Gerak tari: tegas dan dinamis, mencerminkan watak masyarakat Malang.',
    ],
  },
  {
    id: 'tari-remo',
    judul: 'Tari Remo',
    kategori: 'Tari',
    kataKunci: ['remo', 'ngremo', 'jombang', 'gongseng', 'penyambutan'],
    ringkasan: 'Tari penyambutan khas Jawa Timur yang menggambarkan keberanian seorang pangeran atau pejuang.',
    sejarah:
      'Tari Remo berasal dari Jombang dan berkembang di Surabaya serta daerah lain di Jawa Timur. Awalnya tari ini ' +
      'menjadi pembuka pertunjukan ludruk, kemudian juga dipakai untuk menyambut tamu kehormatan. Dikenal beberapa ' +
      'gaya, misalnya Remo Surabayan, Jombangan, dan Malangan.',
    makna: [
      'Hentakan kaki dengan gongseng (lonceng kecil di pergelangan kaki) menandai semangat dan ketegasan.',
      'Gerak gagah menggambarkan keberanian pejuang.',
      'Sebagai tari pembuka, Remo adalah ungkapan selamat datang kepada penonton.',
    ],
  },
  {
    id: 'tari-gandrung',
    judul: 'Tari Gandrung Banyuwangi',
    kategori: 'Tari',
    kataKunci: ['gandrung', 'banyuwangi', 'osing', 'omprok'],
    ringkasan: 'Tari khas Banyuwangi yang menjadi ikon budaya masyarakat Osing.',
    sejarah:
      'Gandrung berasal dari Banyuwangi dan dikenal sebagai ungkapan rasa syukur masyarakat, misalnya setelah ' +
      'panen. Penarinya mengenakan mahkota khas bernama omprok dan menari diiringi musik gamelan Osing.',
    makna: [
      '"Gandrung" berarti terpesona atau tergila-gila, menggambarkan kekaguman.',
      'Menjadi simbol identitas budaya Banyuwangi.',
    ],
  },
  {
    id: 'tari-beskalan',
    judul: 'Tari Beskalan',
    kategori: 'Tari',
    kataKunci: ['beskalan', 'bekalan'],
    ringkasan: 'Tari tradisi khas Malang yang biasa dibawakan sebagai tari pembuka atau penyambutan.',
    sejarah:
      'Beskalan termasuk tari tradisi Malang yang dibawakan sebagai pembuka acara atau pertunjukan. Gerak dan ' +
      'kostumnya memiliki ciri gaya Malangan.',
  },
  {
    id: 'jaranan-reog',
    idMateri: 'jaranan-reog',
    judul: 'Jaranan & Reog',
    kategori: 'Pertunjukan',
    kataKunci: ['jaranan', 'reog', 'ponorogo', 'kuda lumping', 'kuda kepang', 'barongan', 'jathilan'],
    ringkasan: 'Kesenian rakyat Jawa Timur dengan kuda anyaman dan barongan.',
    sejarah:
      'Jaranan dimainkan penari yang menunggang kuda tiruan dari anyaman bambu, diiringi kendang, gong, dan ' +
      'terompet. Reog dari Ponorogo menampilkan topeng barongan berhias bulu merak. Keduanya tumbuh sebagai ' +
      'kesenian rakyat di berbagai daerah Jawa Timur.',
    linimasa: [
      'Kediri: jaranan berkembang luas di Kediri, Tulungagung, dan Malang.',
      'Ponorogo: reog menjadi ikon kesenian Ponorogo.',
      '2024: UNESCO menetapkan Reog Ponorogo sebagai Warisan Budaya Tak Benda.',
    ],
    makna: [
      'Kuda kepang: simbol semangat dan keberanian prajurit.',
      'Barongan: kekuatan besar yang harus dikendalikan.',
      'Kendang & gong: membangun irama yang menghentak.',
      'Kebersamaan: dimainkan beramai-ramai oleh warga desa.',
    ],
  },
  {
    id: 'ludruk',
    judul: 'Ludruk',
    kategori: 'Teater',
    kataKunci: ['ludruk', 'kidungan', 'durasim', 'jula-juli'],
    ringkasan: 'Teater rakyat khas Jawa Timur dengan bahasa Jawa Timuran, kidungan, dan humor.',
    sejarah:
      'Ludruk berkembang di Jawa Timur, terutama Surabaya dan Jombang. Pertunjukannya biasanya dibuka dengan Tari ' +
      'Remo, dilanjutkan kidungan (syair berlagu, misalnya jula-juli), lawakan, lalu cerita kehidupan rakyat atau ' +
      'kisah perjuangan. Seniman ludruk Cak Durasim dikenal karena kidungan yang menyindir penjajah pada masa ' +
      'pendudukan Jepang.',
    makna: [
      'Kidungan dan lawakan menjadi sarana kritik sosial yang ringan.',
      'Memakai bahasa sehari-hari sehingga dekat dengan rakyat.',
    ],
  },
  {
    id: 'ketoprak',
    idMateri: 'ketoprak',
    judul: 'Ketoprak',
    kategori: 'Teater',
    kataKunci: ['ketoprak', 'kethoprak', 'lesung', 'babad'],
    ringkasan: 'Teater tradisional Jawa yang memadukan cerita dan gamelan.',
    sejarah:
      'Ketoprak lahir sebagai hiburan rakyat di Jawa pada awal abad ke-20 dan menyebar ke Jawa Timur. Ceritanya ' +
      'diambil dari babad, legenda, dan kisah kerajaan, dibawakan dengan dialog berbahasa Jawa yang diselingi humor.',
    linimasa: [
      'Awal 1900-an: ketoprak lesung dimainkan petani dengan iringan bunyi lesung.',
      '1920-an: mulai diiringi gamelan dan tampil sebagai pertunjukan panggung.',
      'Kini: tampil di radio, televisi, dan Panggung Terbuka TKBJ.',
    ],
    makna: [
      'Cerita babad: menghidupkan sejarah agar mudah dipahami masyarakat.',
      'Humor: kritik sosial disampaikan lewat canda yang ringan.',
      'Bahasa Jawa: melestarikan tingkatan bahasa dan unggah-ungguh.',
      'Gamelan: mengatur suasana dan pergantian adegan.',
    ],
  },
  {
    id: 'gamelan',
    idMateri: 'gamelan',
    judul: 'Gamelan Slendro Pelog',
    kategori: 'Musik',
    kataKunci: ['gamelan', 'karawitan', 'slendro', 'pelog', 'gong', 'kendang', 'saron', 'bonang'],
    ringkasan: 'Ansambel musik tradisional Jawa dengan dua sistem nada.',
    sejarah:
      'Gamelan adalah ansambel yang terdiri dari gong, kenong, saron, bonang, kendang, dan instrumen lain. Laras ' +
      'slendro memakai lima nada dengan jarak hampir sama, sedangkan pelog memakai tujuh nada dengan jarak berbeda-beda.',
    linimasa: [
      'Abad 8: relief Candi Borobudur menggambarkan alat musik mirip gamelan.',
      'Keraton: gamelan berkembang sebagai musik upacara dan seni istana.',
      '2021: UNESCO menetapkan gamelan sebagai Warisan Budaya Tak Benda.',
    ],
    makna: [
      'Gong: penanda akhir siklus lagu, lambang keteraturan.',
      'Kendang: pengatur tempo, seperti pemimpin dalam masyarakat.',
      'Slendro: bernuansa riang dan gagah. Pelog: bernuansa khidmat dan lembut.',
    ],
  },
  {
    id: 'arsitektur-joglo',
    idMateri: 'arsitektur-joglo',
    judul: 'Arsitektur Joglo',
    kategori: 'Arsitektur',
    kataKunci: ['joglo', 'pendopo', 'soko guru', 'arsitektur', 'bangunan'],
    ringkasan: 'Bangunan tradisional Jawa dengan atap tinggi dan soko guru; konsep Pendopo Agung TKBJ.',
    sejarah:
      'Joglo adalah bangunan tradisional Jawa dengan atap tinggi di bagian tengah yang ditopang empat tiang utama ' +
      '(soko guru). Pendopo Agung TKBJ memakai konsep ruang terbuka ini sehingga penonton dapat menyaksikan ' +
      'pertunjukan dari berbagai sisi.',
    linimasa: [
      'Pendopo: bagian depan yang terbuka untuk menerima tamu dan pertunjukan.',
      'Pringgitan: ruang peralihan, tempat pertunjukan wayang digelar.',
      'Dalem: ruang keluarga dan bagian paling privat.',
    ],
    makna: [
      'Atap tinggi: semakin tinggi, semakin dekat dengan Sang Pencipta.',
      'Soko guru: empat tiang utama melambangkan empat arah mata angin.',
      'Ruang terbuka: keterbukaan dan keramahan kepada tamu.',
      'Tumpang sari: susunan balok bertingkat yang menopang atap.',
    ],
  },
];

/** Kata umum yang tidak menentukan topik ("tari kecak" tidak boleh cocok dengan "Tari Remo" hanya karena "tari"). */
const GENERIC_WORDS = new Set(['tari', 'tarian', 'seni', 'kesenian', 'budaya', 'sejarah', 'asal', 'usul', 'makna', 'filosofi', 'tentang', 'jelaskan', 'ceritakan', 'apa', 'itu', 'jawa', 'timur']);

/** Cari entri yang cocok dengan topik (judul atau kata kunci), paling cocok dulu. */
export function findCulture(topic: string, entries: CultureEntry[] = CULTURE_ENTRIES): CultureEntry[] {
  const q = topic.toLowerCase().trim();
  if (!q) return [];
  const words = q.split(/[^a-z0-9-]+/).filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w));
  const score = (e: CultureEntry) => {
    const title = e.judul.toLowerCase();
    if (title.includes(q) || q.includes(title)) return 3;
    if (e.kataKunci.some((k) => q.includes(k))) return 2;
    return words.some((w) => title.includes(w) || e.kataKunci.some((k) => k.includes(w))) ? 1 : 0;
  };
  return entries.map((e) => ({ e, s: score(e) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.e);
}
