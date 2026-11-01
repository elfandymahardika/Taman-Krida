// Data contoh awal database. Sama dengan data contoh dashboard sebelumnya,
// ditambah beberapa data September agar pilihan periode punya isi.

/** Waktu lokal WIB → ISO UTC. */
export const wib = (date: string, time = '00:00') => new Date(`${date}T${time}:00+07:00`).toISOString()

export interface SeedUser {
  username: string
  password: string
  name: string
  email: string
  roleKey: string | null
  initials: string
  status: string
  lastSeenAt: string | null
}

/**
 * Staf admin = akun login. Staf selain `admin` dan `keuangan` memakai password `tkbj2026`.
 * Akun demo per peran untuk uji coba: admin, nur.aini (Acara), keuangan, rina.s (Sewa), siti.rahma (Konten).
 * `dimas.p` = contoh hasil registrasi yang menunggu persetujuan.
 */
export const USERS: SeedUser[] = [
  { username: 'admin', password: 'admin123', name: 'Admin Pusat', email: 'admin.pusat@tkbj.jatimprov.go.id', roleKey: 'admin', initials: 'AP', status: 'Aktif', lastSeenAt: wib('2026-10-02', '09:30') },
  { username: 'siti.rahma', password: 'tkbj2026', name: 'Siti Rahma', email: 'siti.rahma@tkbj.jatimprov.go.id', roleKey: 'konten', initials: 'SR', status: 'Aktif', lastSeenAt: wib('2026-10-02', '08:35') },
  { username: 'keuangan', password: 'keuangan123', name: 'Agus Prasetyo', email: 'agus.p@tkbj.jatimprov.go.id', roleKey: 'keuangan', initials: 'AG', status: 'Aktif', lastSeenAt: wib('2026-10-02', '09:25') },
  { username: 'wahyu.h', password: 'tkbj2026', name: 'Wahyu Hidayat', email: 'wahyu.h@tkbj.jatimprov.go.id', roleKey: 'sewa', initials: 'WH', status: 'Nonaktif', lastSeenAt: wib('2026-09-18', '15:10') },
  { username: 'nur.aini', password: 'tkbj2026', name: 'Nur Aini', email: 'nur.aini@tkbj.jatimprov.go.id', roleKey: 'acara', initials: 'NA', status: 'Aktif', lastSeenAt: wib('2026-10-02', '09:10') },
  { username: 'bayu.k', password: 'tkbj2026', name: 'Bayu Kurniawan', email: 'bayu.k@tkbj.jatimprov.go.id', roleKey: 'acara', initials: 'BK', status: 'Aktif', lastSeenAt: wib('2026-10-01', '17:45') },
  { username: 'lestari.ayu', password: 'tkbj2026', name: 'Lestari Ayu', email: 'lestari.ayu@tkbj.jatimprov.go.id', roleKey: 'keuangan', initials: 'LA', status: 'Aktif', lastSeenAt: wib('2026-10-01', '16:20') },
  { username: 'rina.s', password: 'tkbj2026', name: 'Rina Sari', email: 'rina.s@tkbj.jatimprov.go.id', roleKey: 'sewa', initials: 'RS', status: 'Aktif', lastSeenAt: wib('2026-10-02', '08:50') },
  { username: 'dimas.p', password: 'tkbj2026', name: 'Dimas Pratama', email: 'dimas.p@tkbj.jatimprov.go.id', roleKey: null, initials: 'DP', status: 'Menunggu persetujuan', lastSeenAt: null },
]

export const PROFILE = {
  name: 'Taman Krida Budaya Jawa Timur',
  manager: 'Dinas Kebudayaan dan Pariwisata Provinsi Jawa Timur',
  address: 'Jl. Soekarno-Hatta No. 7, Kota Malang',
  phone: '(0341) 491 234',
  whatsapp: '0812-3300-1977',
  hours: 'Setiap hari · 08.00–22.00 WIB',
  about: 'Pusat kegiatan seni dan budaya Jawa Timur yang menyediakan ruang pertunjukan, pameran, dan latihan bagi komunitas.',
}

/** `bookable` = dipakai sebagai lokasi acara & sewa (namanya dikunci agar data tetap konsisten). */
export const FACILITIES = [
  { id: 'pendopo', name: 'Pendopo Agung TKBJ', capacity: 300, purpose: 'Pertunjukan tradisi', photo: 'wayang', bookable: true },
  { id: 'panggung', name: 'Panggung Terbuka', capacity: 500, purpose: 'Pentas luar ruang', photo: 'topeng', bookable: true },
  { id: 'galeri', name: 'Gedung Kesenian & Galeri', capacity: 120, purpose: 'Pameran dan lokakarya', photo: 'ketoprak', bookable: true },
  { id: 'loket', name: 'Area Loket & Parkir', capacity: null, purpose: 'Pintu masuk utama · Loket tiket', photo: null, bookable: false },
]

const MB = 1024 * 1024
export const MEDIA = [
  { id: 'm1', title: 'Pagelaran Wayang Kulit', collection: 'Pertunjukan Oktober', date: '2026-10-02', type: 'Foto', photo: 'wayang', status: 'Terpublikasi', credit: 'Dokumentasi TKBJ', bytes: 2.4 * MB, dims: '1920×1080' },
  { id: 'm2', title: 'Tari Topeng Malangan', collection: 'Pertunjukan Oktober', date: '2026-10-03', type: 'Foto', photo: 'topeng', status: 'Terpublikasi', credit: 'Sanggar Tari Mekar Sari', bytes: 3.1 * MB, dims: '2048×1365' },
  { id: 'm3', title: 'Ketoprak Guyub Rukun', collection: 'Pertunjukan Oktober', date: '2026-10-04', type: 'Foto', photo: 'ketoprak', status: 'Terpublikasi', credit: 'Dokumentasi TKBJ', bytes: 2.8 * MB, dims: '2048×1365' },
  { id: 'm4', title: 'Gladi Wayang Wahyu Budoyo', collection: 'Di balik panggung', date: '2026-10-01', type: 'Video', photo: 'wayang', status: 'Draf', credit: 'Admin Konten', bytes: 48 * MB, dims: '1080p · 02.14' },
  { id: 'm5', title: 'Kostum Topeng Panji', collection: 'Koleksi busana', date: '2026-09-28', type: 'Foto', photo: 'topeng', status: 'Terpublikasi', credit: 'Sanggar Tari Mekar Sari', bytes: 1.9 * MB, dims: '1600×1067' },
  { id: 'm6', title: 'Panggung Ketoprak Malam', collection: 'Di balik panggung', date: '2026-09-27', type: 'Foto', photo: 'ketoprak', status: 'Draf', credit: 'Dokumentasi TKBJ', bytes: 2.2 * MB, dims: '1920×1280' },
].map((m) => ({ ...m, bytes: Math.round(m.bytes), description: `Dokumentasi ${m.title.toLowerCase()} di Taman Krida Budaya Jawa Timur.` }))

export const CONTENTS = [
  {
    id: 'c1', title: 'Pekan Wayang Oktober di TKBJ', type: 'Banner beranda', author: 'Admin Konten', status: 'Terpublikasi', updatedAt: wib('2026-10-02', '08:40'), hero: true,
    body: 'Saksikan pagelaran wayang kulit, tari topeng, dan ketoprak setiap akhir pekan di Taman Krida Budaya Jawa Timur.',
    cta: 'Lihat agenda', link: '/agenda', from: '2026-10-01', to: '2026-10-31',
  },
  { id: 'c2', title: 'Jadwal pentas akhir pekan 2–4 Oktober', type: 'Pengumuman', author: 'Admin Acara', status: 'Terpublikasi', updatedAt: wib('2026-10-01', '16:15') },
  { id: 'c3', title: 'Mengenal Topeng Malangan dan tokoh Panji', type: 'Artikel budaya', author: 'Siti Rahma', status: 'Terpublikasi', updatedAt: wib('2026-09-30', '11:02') },
  { id: 'c4', title: 'Pendaftaran Festival Seni Tradisi dibuka', type: 'Berita', author: 'Admin Konten', status: 'Terjadwal', updatedAt: wib('2026-10-02', '09:05') },
  { id: 'c5', title: 'Penyesuaian jam layanan loket tiket', type: 'Pengumuman', author: 'Admin Pusat', status: 'Draf', updatedAt: wib('2026-09-29', '14:30') },
  { id: 'c6', title: 'Lokakarya batik Malangan untuk pelajar', type: 'Berita', author: 'Siti Rahma', status: 'Draf', updatedAt: wib('2026-09-28', '10:20') },
]

const PRICE = 50000

export const EVENTS = [
  { id: 'sep-reog', name: 'Reog Ponorogo Malam Purnama', short: 'Reog Ponorogo', organizer: 'Paguyuban Reog Singo Barong', date: '2026-09-05', start: '19:00', end: '22:00', venue: 'Panggung Terbuka', status: 'Terpublikasi', sold: 280, quota: 300 },
  { id: 'sep-gamelan', name: 'Konser Gamelan Kontemporer', short: 'Konser gamelan', organizer: 'Paguyuban Sekar Laras', date: '2026-09-12', start: '19:00', end: '21:00', venue: 'Pendopo Agung TKBJ', status: 'Terpublikasi', sold: 190, quota: 250 },
  { id: 'sep-remo', name: 'Gelar Tari Remo', short: 'Tari Remo', organizer: 'Sanggar Tari Mekar Sari', date: '2026-09-19', start: '16:00', end: '18:00', venue: 'Panggung Terbuka', status: 'Terpublikasi' },
  { id: 'sep-wayang-orang', name: 'Wayang Orang Panji Asmarabangun', short: 'Wayang orang', organizer: "Paguyuban Wayang 'Wahyu Budoyo'", date: '2026-09-26', start: '19:00', end: '22:00', venue: 'Pendopo Agung TKBJ', status: 'Terpublikasi', sold: 240, quota: 300 },
  { id: 'wayang', name: 'Pagelaran Wayang Kulit', short: 'Wayang Kulit', organizer: "Paguyuban Wayang 'Wahyu Budoyo'", date: '2026-10-02', start: '19:00', end: '23:00', venue: 'Pendopo Agung TKBJ', status: 'Terpublikasi', sold: 210, quota: 300, photo: 'wayang' },
  { id: 'topeng', name: 'Tari Topeng Malangan', short: 'Tari Topeng', organizer: 'Sanggar Tari Mekar Sari', date: '2026-10-03', start: '16:00', end: '18:00', venue: 'Panggung Terbuka', status: 'Terpublikasi', sold: 176, quota: 300, photo: 'topeng' },
  { id: 'ketoprak', name: 'Ketoprak Guyub Rukun', short: 'Ketoprak', organizer: "Komunitas Ketoprak 'Guyub Rukun'", date: '2026-10-04', start: '19:00', end: '21:00', venue: 'Pendopo Agung TKBJ', status: 'Terpublikasi', sold: 100, quota: 200, photo: 'ketoprak' },
  { id: 'karawitan', name: 'Latihan Karawitan Bersama', short: 'Latihan karawitan', organizer: 'Paguyuban Sekar Laras', date: '2026-10-07', start: '15:00', end: '17:00', venue: 'Pendopo Agung TKBJ', status: 'Terpublikasi' },
  { id: 'ludruk', name: 'Ludruk Malangan', short: 'Ludruk Malangan', organizer: 'Kelompok Ludruk Karya Budaya', date: '2026-10-09', start: '19:00', end: '21:00', venue: 'Panggung Terbuka', status: 'Terpublikasi' },
  { id: 'kriya', name: 'Pameran Kriya Jawa Timur', short: 'Pameran kriya', organizer: 'Dekranasda Jatim', date: '2026-10-12', start: '09:00', end: '16:00', venue: 'Gedung Kesenian & Galeri', status: 'Terpublikasi' },
  { id: 'tradisi', name: 'Pentas Tari Tradisi', short: 'Tari tradisi', organizer: 'Sanggar Sekar Arum', date: '2026-10-16', start: '16:00', end: '18:00', venue: 'Panggung Terbuka', status: 'Terpublikasi' },
  { id: 'jaranan', name: 'Jaranan Dor', short: 'Jaranan Dor', organizer: 'Paguyuban Jaranan Turonggo', date: '2026-10-18', start: '15:00', end: '17:00', venue: 'Panggung Terbuka', status: 'Terpublikasi' },
  { id: 'batik', name: 'Lokakarya Batik Malangan', short: 'Lokakarya batik', organizer: 'Komunitas Kriya Tunas', date: '2026-10-21', start: '10:00', end: '13:00', venue: 'Gedung Kesenian & Galeri', status: 'Terpublikasi' },
  { id: 'festival', name: 'Festival Seni Tradisi', short: 'Festival seni', organizer: 'Tim program TKBJ', date: '2026-10-24', start: '09:00', end: '17:00', venue: 'Panggung Terbuka', status: 'Draf' },
  { id: 'diskusi', name: 'Diskusi Budaya Panji', short: 'Diskusi budaya', organizer: 'Tim program TKBJ', date: '2026-10-28', start: '13:00', end: '15:00', venue: 'Gedung Kesenian & Galeri', status: 'Draf' },
  { id: 'pentas', name: 'Pentas Akhir Bulan', short: 'Pentas akhir bulan', organizer: 'Tim program TKBJ', date: '2026-10-31', start: '19:00', end: '22:00', venue: 'Pendopo Agung TKBJ', status: 'Draf' },
].map((e) => ({ price: e.quota !== undefined ? PRICE : null, ...e }))

/** Tarif sewa per hari, dipakai saat permintaan sewa disetujui. */
export const RENTAL_RATES: Record<string, number> = {
  'Pendopo Agung TKBJ': 2500000,
  'Panggung Terbuka': 2000000,
  'Gedung Kesenian & Galeri': 1500000,
}

export const RENTALS = [
  { id: 'SG-0926-0012', applicant: 'Sanggar Wilwatikta', venue: 'Pendopo Agung TKBJ', date: '2026-09-14', start: '13:00', end: '18:00', activity: 'Ujian tari sanggar · 90 peserta', approval: 'Disetujui', file: 'proposal-ujian.pdf · 720 KB', submittedAt: wib('2026-09-02', '10:10') },
  { id: 'SG-0926-0013', applicant: 'Teater Komunitas Malang', venue: 'Gedung Kesenian & Galeri', date: '2026-09-21', start: '18:00', end: '21:00', activity: 'Pentas teater · 110 penonton', approval: 'Disetujui', file: 'proposal-teater.pdf · 1,1 MB', submittedAt: wib('2026-09-05', '15:30') },
  { id: 'SG-1026-0014', applicant: 'Sanggar Puspa Budaya', venue: 'Panggung Terbuka', date: '2026-10-25', start: '16:00', end: '20:00', activity: 'Festival tari remaja · 200 penonton', approval: 'Perlu ditinjau', file: 'proposal-festival.pdf · 1,6 MB', submittedAt: wib('2026-10-02', '07:55') },
  { id: 'SG-1026-0015', applicant: 'Paguyuban Sekar Laras', venue: 'Pendopo Agung TKBJ', date: '2026-10-15', start: '13:00', end: '17:00', activity: 'Gladi karawitan · 40 peserta', approval: 'Perlu ditinjau', file: 'surat-permohonan.pdf · 640 KB', submittedAt: wib('2026-10-01', '16:40') },
  { id: 'SG-1026-0016', applicant: 'Sanggar Cipta Laras', venue: 'Gedung Kesenian & Galeri', date: '2026-10-06', start: '09:00', end: '15:00', activity: 'Lokakarya kriya · 80 peserta', approval: 'Perlu ditinjau', file: 'proposal-kriya.pdf · 1,2 MB', submittedAt: wib('2026-10-01', '14:20') },
  { id: 'SG-1026-0017', applicant: 'Komunitas Ruang Seni', venue: 'Gedung Kesenian & Galeri', date: '2026-10-11', start: '09:00', end: '17:00', activity: 'Pameran lukis · 120 pengunjung', approval: 'Disetujui', file: 'proposal-pameran.pdf · 2,1 MB', submittedAt: wib('2026-09-30', '10:05') },
  { id: 'SG-1026-0018', applicant: 'Sanggar Mekar Sari', venue: 'Pendopo Agung TKBJ', date: '2026-10-10', start: '15:00', end: '21:00', activity: 'Pentas tari anak · 150 penonton', approval: 'Disetujui', file: 'proposal-pentas.pdf · 980 KB', submittedAt: wib('2026-10-02', '08:50') },
]

const proof = (method: string, file: string, from: string, date: string, time: string) => ({ proofMethod: method, proofFile: file, proofFrom: from, proofSubmittedAt: wib(date, time) })

export interface SeedOrder {
  id: string
  type: string
  customer: string
  eventId?: string
  rentalId?: string
  service?: string
  serviceDate?: string
  qty?: number
  amount: number
  payment: string
  method?: string
  proofMethod?: string
  proofFile?: string
  proofFrom?: string
  proofSubmittedAt?: string
  createdAt: string
  paidAt?: string
}

export const ORDERS: SeedOrder[] = [
  { id: 'SG-0926-0012', type: 'Sewa gedung', customer: 'Sanggar Wilwatikta', rentalId: 'SG-0926-0012', service: 'Pendopo Agung TKBJ', serviceDate: '2026-09-14', amount: 2500000, payment: 'Lunas', method: 'Transfer bank', createdAt: wib('2026-09-03', '09:00'), paidAt: wib('2026-09-04', '11:20') },
  { id: 'SG-0926-0013', type: 'Sewa gedung', customer: 'Teater Komunitas Malang', rentalId: 'SG-0926-0013', service: 'Gedung Kesenian & Galeri', serviceDate: '2026-09-21', amount: 1500000, payment: 'Lunas', method: 'Transfer bank', createdAt: wib('2026-09-06', '10:00'), paidAt: wib('2026-09-07', '13:45') },
  { id: 'TK-1026-0121', type: 'Tiket', customer: 'Andi Wijaya', eventId: 'ketoprak', qty: 4, amount: 200000, payment: 'Perlu verifikasi', createdAt: wib('2026-10-01', '15:10'), ...proof('Transfer Mandiri', 'bukti-tk-0121.jpg · 344 KB', 'a.n. Andi Wijaya', '2026-10-01', '15:30') },
  { id: 'TK-1026-0122', type: 'Tiket', customer: 'Lestari Handayani', eventId: 'wayang', qty: 2, amount: 100000, payment: 'Lunas', method: 'QRIS', createdAt: wib('2026-10-01', '16:05'), paidAt: wib('2026-10-01', '16:10') },
  { id: 'TK-1026-0123', type: 'Tiket', customer: 'Yoga Pratama', eventId: 'ketoprak', qty: 5, amount: 250000, payment: 'Perlu verifikasi', createdAt: wib('2026-10-01', '18:00'), ...proof('QRIS', 'bukti-tk-0123.png · 198 KB', 'a.n. Yoga Pratama', '2026-10-01', '18:22') },
  { id: 'TK-1026-0124', type: 'Tiket', customer: 'Sri Wahyuni', eventId: 'topeng', qty: 2, amount: 100000, payment: 'Menunggu bayar', createdAt: wib('2026-10-01', '19:40') },
  { id: 'TK-1026-0125', type: 'Tiket', customer: 'Ahmad Fauzi', eventId: 'wayang', qty: 1, amount: 50000, payment: 'Perlu verifikasi', createdAt: wib('2026-10-01', '20:50'), ...proof('Transfer BCA', 'bukti-tk-0125.jpg · 301 KB', 'a.n. Ahmad Fauzi', '2026-10-01', '21:05') },
  { id: 'TK-1026-0126', type: 'Tiket', customer: 'Dewi Lestari', eventId: 'ketoprak', qty: 3, amount: 150000, payment: 'Lunas', method: 'Transfer bank', createdAt: wib('2026-10-01', '19:55'), paidAt: wib('2026-10-01', '20:12') },
  { id: 'SG-1026-0017', type: 'Sewa gedung', customer: 'Komunitas Ruang Seni', rentalId: 'SG-1026-0017', service: 'Gedung Kesenian & Galeri', serviceDate: '2026-10-11', amount: 1500000, payment: 'Menunggu bayar', createdAt: wib('2026-10-01', '09:30') },
  { id: 'TK-1026-0127', type: 'Tiket', customer: 'Budi Santoso', eventId: 'topeng', qty: 4, amount: 200000, payment: 'Perlu verifikasi', createdAt: wib('2026-10-02', '07:30'), ...proof('Transfer BRI', 'bukti-tk-0127.png · 288 KB', 'a.n. Budi Santoso', '2026-10-02', '07:42') },
  { id: 'SG-1026-0018', type: 'Sewa gedung', customer: 'Sanggar Mekar Sari', rentalId: 'SG-1026-0018', service: 'Pendopo Agung TKBJ', serviceDate: '2026-10-10', amount: 2500000, payment: 'Perlu verifikasi', createdAt: wib('2026-10-02', '08:40'), ...proof('Transfer Bank Jatim', 'bukti-sg-0018.jpg · 412 KB', 'a.n. Sanggar Mekar Sari', '2026-10-02', '08:50') },
  { id: 'TK-1026-0128', type: 'Tiket', customer: 'Rina Wulandari', eventId: 'wayang', qty: 2, amount: 100000, payment: 'Lunas', method: 'QRIS', createdAt: wib('2026-10-02', '09:20'), paidAt: wib('2026-10-02', '09:25') },
]

export const COMMUNITIES = [
  { id: 'wahyu', name: "Paguyuban Wayang 'Wahyu Budoyo'", category: 'Seni pertunjukan', city: 'Kota Malang', members: 42, contact: '0813-3456-2201', photo: 'wayang', status: 'Aktif', leader: 'Ki Sugeng Rawuh', since: 'Berdiri 1998' },
  { id: 'mekar', name: 'Sanggar Tari Mekar Sari', category: 'Seni tari tradisional', city: 'Kab. Malang', members: 65, contact: '0812-4410-8823', photo: 'topeng', status: 'Aktif', leader: 'Sri Rahayu', since: 'Berdiri 2004' },
  { id: 'guyub', name: "Komunitas Ketoprak 'Guyub Rukun'", category: 'Seni pertunjukan', city: 'Kota Batu', members: 38, contact: '0857-3012-7745', photo: 'ketoprak', status: 'Aktif', leader: 'Bambang Sutejo', since: 'Berdiri 2010' },
  { id: 'sekar', name: 'Paguyuban Sekar Laras', category: 'Seni musik', city: 'Kota Malang', members: 27, contact: '0821-3390-1102', photo: 'wayang', status: 'Aktif', leader: 'Hadi Purnomo', since: 'Berdiri 2012' },
  { id: 'ludruk', name: 'Kelompok Ludruk Karya Budaya', category: 'Seni pertunjukan', city: 'Kab. Malang', members: 31, contact: '0813-5520-4410', photo: 'ketoprak', status: 'Aktif', leader: 'Cak Kartolo', since: 'Berdiri 2001' },
  { id: 'turonggo', name: 'Paguyuban Jaranan Turonggo', category: 'Seni tari tradisional', city: 'Kab. Blitar', members: 45, contact: '0852-3301-7789', photo: 'topeng', status: 'Nonaktif', leader: 'Mbah Suroso', since: 'Berdiri 1995' },
  { id: 'arum', name: 'Sanggar Sekar Arum', category: 'Seni tari tradisional', city: 'Kab. Pasuruan', members: 24, contact: '0812-3344-5566', photo: 'topeng', status: 'Menunggu persetujuan', leader: 'Endang Sulistyowati', since: 'Berdiri 2015', appliedAt: wib('2026-10-01', '14:20') },
  { id: 'tunas', name: 'Komunitas Kriya Tunas', category: 'Seni kriya', city: 'Kota Malang', members: 18, contact: '0856-7788-9900', photo: 'wayang', status: 'Menunggu persetujuan', leader: 'Rudi Hartono', since: 'Berdiri 2019', appliedAt: wib('2026-09-30', '10:45') },
]

// Dalam juta rupiah. Penjualan = tiket + sewa; pembelian per kategori.
export const PURCHASE_CATEGORIES = ['Perlengkapan panggung', 'Honor seniman', 'Pemeliharaan gedung', 'Promosi']
export const FINANCE = [
  { month: '2026-01', ticket: 14.2, rental: 10.5, purchases: [6.1, 8.4, 3.2, 1.5] },
  { month: '2026-02', ticket: 12.8, rental: 9.0, purchases: [4.3, 7.6, 2.9, 1.2] },
  { month: '2026-03', ticket: 16.5, rental: 12.4, purchases: [7.8, 9.9, 3.4, 2.0] },
  { month: '2026-04', ticket: 18.9, rental: 11.7, purchases: [5.2, 10.8, 6.5, 2.3] },
  { month: '2026-05', ticket: 20.4, rental: 14.1, purchases: [6.0, 11.2, 3.1, 2.6] },
  { month: '2026-06', ticket: 17.2, rental: 15.6, purchases: [9.4, 10.1, 4.0, 3.0] },
  { month: '2026-07', ticket: 22.6, rental: 16.3, purchases: [7.1, 12.5, 3.6, 2.8] },
  { month: '2026-08', ticket: 26.8, rental: 17.9, purchases: [11.3, 14.6, 5.2, 3.9] },
  { month: '2026-09', ticket: 21.5, rental: 16.8, purchases: [6.4, 11.8, 7.9, 2.4] },
  { month: '2026-10', ticket: 24.3, rental: 18.3, purchases: [8.2, 13.4, 3.5, 3.1] },
]

export const ACTIVITY = [
  { kind: 'community', title: 'Pendaftaran komunitas baru', sub: 'Komunitas Kriya Tunas · Seni kriya', createdAt: wib('2026-09-30', '10:45') },
  { kind: 'community', title: 'Pendaftaran komunitas baru', sub: 'Sanggar Sekar Arum · Seni tari tradisional', createdAt: wib('2026-10-01', '14:19') },
  { kind: 'rental', title: 'Permintaan sewa gedung masuk', sub: 'Sanggar Cipta Laras · SG-1026-0016', createdAt: wib('2026-10-01', '14:20') },
  { kind: 'payment', title: 'Bukti transfer diunggah', sub: 'Andi Wijaya · TK-1026-0121', createdAt: wib('2026-10-01', '15:30') },
  { kind: 'rental', title: 'Permintaan sewa gedung masuk', sub: 'Paguyuban Sekar Laras · SG-1026-0015', createdAt: wib('2026-10-01', '16:40') },
  { kind: 'payment', title: 'Bukti transfer diunggah', sub: 'Yoga Pratama · TK-1026-0123', createdAt: wib('2026-10-01', '18:22') },
  { kind: 'payment', title: 'Pembayaran tiket dikonfirmasi', sub: 'Admin Keuangan · TK-1026-0126', createdAt: wib('2026-10-01', '20:12') },
  { kind: 'payment', title: 'Bukti transfer diunggah', sub: 'Ahmad Fauzi · TK-1026-0125', createdAt: wib('2026-10-01', '21:05') },
  { kind: 'payment', title: 'Bukti transfer diunggah', sub: 'Budi Santoso · TK-1026-0127', createdAt: wib('2026-10-02', '07:42') },
  { kind: 'rental', title: 'Permintaan sewa gedung masuk', sub: 'Sanggar Puspa Budaya · SG-1026-0014', createdAt: wib('2026-10-02', '07:55') },
  { kind: 'user', title: 'Peran admin konten diperbarui', sub: 'Admin Pusat · Siti Rahma', createdAt: wib('2026-10-02', '08:15') },
  { kind: 'gallery', title: 'Koleksi virtual galeri ditambahkan', sub: 'Admin Konten · 6 foto pertunjukan', createdAt: wib('2026-10-02', '08:35') },
  { kind: 'payment', title: 'Bukti transfer diunggah', sub: 'Sanggar Mekar Sari · SG-1026-0018', createdAt: wib('2026-10-02', '08:50') },
  { kind: 'event', title: 'Agenda Tari Topeng diperbarui', sub: 'Admin Acara · 3 Oktober 2026', createdAt: wib('2026-10-02', '09:10') },
  { kind: 'payment', title: 'Pembayaran tiket dikonfirmasi', sub: 'Admin Keuangan · TK-1026-0128', createdAt: wib('2026-10-02', '09:25') },
]

export const NOTIFICATIONS = [
  { message: '6 foto ditambahkan ke virtual galeri', link: '/galeri', createdAt: wib('2026-10-02', '08:35') },
  { message: 'Bukti transfer SG-1026-0018 menunggu verifikasi', link: '/transaksi', createdAt: wib('2026-10-02', '08:50') },
  { message: 'Pembayaran TK-1026-0128 dikonfirmasi', link: '/transaksi', createdAt: wib('2026-10-02', '09:25') },
]

/** Catatan staf (Modul 02): milik akun tertentu, untuk menguji isolasi data antar-user. */
export const NOTES = [
  { username: 'admin', title: 'Rapat koordinasi Festival Seni Tradisi', content: 'Undang perwakilan sanggar & Disbudpar, siapkan rundown dan kebutuhan panggung.', status: 'Terpublikasi', createdAt: wib('2026-09-29', '10:00') },
  { username: 'admin', title: 'Evaluasi tarif sewa 2027', content: 'Bandingkan tarif Pendopo dengan gedung sejenis di Malang Raya.', status: 'Draf', createdAt: wib('2026-10-01', '13:30') },
  { username: 'nur.aini', title: 'Checklist gladi Wayang Kulit', content: 'Sound system, kelir, blencong, konsumsi pengrawit 25 orang.', status: 'Terpublikasi', createdAt: wib('2026-10-01', '08:15') },
  { username: 'nur.aini', title: 'Ide acara November', content: 'Pekan ludruk pelajar, kerja sama dengan sekolah di Kota Malang.', status: 'Draf', createdAt: wib('2026-10-02', '07:50') },
  { username: 'siti.rahma', title: 'Jadwal unggah artikel budaya', content: 'Artikel Topeng Malangan tiap Senin, liputan pentas tiap Jumat.', status: 'Terpublikasi', createdAt: wib('2026-09-30', '09:40') },
  { username: 'keuangan', title: 'Rekonsiliasi QRIS September', content: 'Cocokkan mutasi QRIS dengan transaksi tiket lunas.', status: 'Diarsipkan', createdAt: wib('2026-09-28', '15:00') },
]
