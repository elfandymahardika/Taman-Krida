// Data contoh API mobile. Pesanan, sewa, dan komunitas milik akun demo merujuk data contoh dashboard
// (backend/admin-dashboard/src/db/seeders/data.ts), jadi jalankan seeder dashboard lebih dulu.

/** Waktu lokal WIB → ISO UTC. */
export const wib = (date: string, time = '00:00') => new Date(`${date}T${time}:00+07:00`).toISOString();

/**
 * Akun pengunjung. `budi` = akun demo aplikasi (sama dengan akun demo prototipe Flutter).
 * `sari` = akun kedua untuk menguji isolasi data (pesanan/sewa milik Budi tidak boleh terlihat).
 */
export const VISITORS = [
  { key: 'budi', name: 'Budi Santoso', email: 'budi.santoso@email.com', phone: '081234567890', city: 'Malang', password: 'tkbj2026', createdAt: wib('2026-01-12', '10:00') },
  { key: 'sari', name: 'Sari Wulandari', email: 'sari.wulandari@email.com', phone: '085712345678', city: 'Surabaya', password: 'tkbj2026', createdAt: wib('2026-03-04', '19:30') },
];

/** Pesanan tiket dashboard yang dibuat lewat aplikasi (TK-1026-0127: Budi Santoso, 4 tiket Tari Topeng, menunggu verifikasi). */
export const VISITOR_ORDERS = [
  { visitor: 'budi', orderId: 'TK-1026-0127', bookingCode: 'TKBJ-A1B2C3', email: 'budi.santoso@email.com', phone: '081234567890', createdAt: wib('2026-10-02', '07:30') },
];

/** Permintaan sewa dashboard yang diajukan Budi atas nama komunitasnya: satu masih ditinjau, satu sudah disetujui & belum dibayar. */
export const VISITOR_RENTALS = [
  { visitor: 'budi', rentalId: 'SG-1026-0014', contact: '081234567890', createdAt: wib('2026-10-02', '07:55') },
  { visitor: 'budi', rentalId: 'SG-1026-0017', contact: '081234567890', createdAt: wib('2026-09-30', '10:05') },
];

/** Pendaftaran komunitas dashboard (Sanggar Sekar Arum, menunggu persetujuan) yang dikirim Budi. */
export const VISITOR_COMMUNITIES = [
  {
    visitor: 'budi',
    communityId: 'arum',
    address: 'Jl. Raya Bangil No. 21, Kab. Pasuruan',
    description: 'Sanggar tari tradisional untuk anak dan remaja, rutin tampil di festival tari Jawa Timur.',
    createdAt: wib('2026-10-01', '14:20'),
  },
];

export const NOTIFICATIONS = [
  { visitor: 'budi', symbol: '📅', title: 'Selamat datang di TKBJ', body: 'Jelajahi kalender acara, pesan tiket pertunjukan, dan ajukan sewa gedung langsung dari aplikasi.', target: 'calendar', targetId: null, createdAt: wib('2026-01-12', '10:00'), read: true },
  { visitor: 'budi', symbol: '✅', title: 'Pengajuan sewa disetujui', body: 'SG-1026-0017 disetujui. Selesaikan pembayaran Rp1.500.000 dan unggah bukti transfer.', target: 'rental', targetId: 'SG-1026-0017', createdAt: wib('2026-10-01', '09:30'), read: false },
  { visitor: 'budi', symbol: '👥', title: 'Pendaftaran komunitas terkirim', body: 'Sanggar Sekar Arum sedang ditinjau pengelola TKBJ.', target: 'communities', targetId: 'arum', createdAt: wib('2026-10-01', '14:20'), read: true },
  { visitor: 'budi', symbol: '🎟', title: 'Bukti transfer diterima', body: 'Pesanan TKBJ-A1B2C3 sedang diverifikasi Admin Keuangan.', target: 'tickets', targetId: 'TKBJ-A1B2C3', createdAt: wib('2026-10-02', '07:42'), read: false },
];
