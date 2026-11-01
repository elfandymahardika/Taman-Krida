/*
 * Kosakata bersama dengan backend/admin-dashboard. Nilai yang ditandai "sama dengan dashboard"
 * harus diubah di kedua backend sekaligus, karena keduanya membaca/menulis tabel yang sama.
 */

/** Tarif sewa per pemakaian (sama dengan RENTAL_RATES di dashboard), ditagihkan saat sewa disetujui. */
export const RENTAL_RATES: Record<string, number> = {
  'Pendopo Agung TKBJ': 2500000,
  'Panggung Terbuka': 2000000,
  'Gedung Kesenian & Galeri': 1500000,
};

/** Slot sewa di aplikasi (4 jam). `key` sama dengan enum RentalSlot di Flutter. */
export const RENTAL_SLOTS = [
  { key: 'morning', label: 'Pagi', start: '08:00', end: '12:00' },
  { key: 'afternoon', label: 'Siang', start: '13:00', end: '17:00' },
  { key: 'evening', label: 'Malam', start: '18:00', end: '22:00' },
] as const;

export type SlotKey = (typeof RENTAL_SLOTS)[number]['key'];

export const findSlot = (key: unknown) => RENTAL_SLOTS.find((s) => s.key === key);

/** Slot yang jamnya paling cocok dengan sewa yang dicatat admin (jam bebas), untuk tampilan aplikasi. */
export const slotOf = (start: string, end: string) =>
  RENTAL_SLOTS.find((s) => s.start === start && s.end === end)?.key ?? null;

/** Berkas wajib saat mengajukan sewa (nama field multipart → label). */
export const RENTAL_DOCUMENTS = [
  { key: 'ktp', label: 'KTP Penanggung Jawab' },
  { key: 'surat', label: 'Surat Permohonan Resmi' },
  { key: 'proposal', label: 'Proposal Kegiatan' },
] as const;

export type DocumentKind = (typeof RENTAL_DOCUMENTS)[number]['key'];

/** Kategori komunitas (sama dengan CATEGORIES di dashboard). */
export const COMMUNITY_CATEGORIES = ['Seni tari tradisional', 'Seni pertunjukan', 'Seni musik', 'Seni kriya'];

/** Metode bayar yang dipilih pengunjung saat mengunggah bukti. Dashboard mencatatnya sebagai metode pembayaran. */
export const PAYMENT_METHODS = ['QRIS', 'Virtual Account', 'E-Wallet', 'Transfer bank'];

/** Kategori acara untuk filter Kalender Acara di aplikasi, ditebak dari nama acara. */
export const EVENT_CATEGORIES = ['Wayang', 'Tari', 'Ketoprak', 'Musik', 'Pameran', 'Lainnya'];

const CATEGORY_RULES: [string, RegExp][] = [
  ['Wayang', /wayang/i],
  ['Ketoprak', /ketoprak|ludruk|teater/i],
  ['Tari', /tari|reog|remo|jaranan|topeng/i],
  ['Musik', /gamelan|karawitan|musik|konser/i],
  ['Pameran', /pameran|kriya|batik|lokakarya|galeri/i],
];

export const eventCategory = (name: string) => CATEGORY_RULES.find(([, re]) => re.test(name))?.[0] ?? 'Lainnya';

export type PaymentStatus = 'Lunas' | 'Perlu verifikasi' | 'Menunggu bayar';
export type Approval = 'Perlu ditinjau' | 'Disetujui' | 'Ditolak';

/** Status pembayaran (enum tabel orders) → label untuk pengunjung. */
export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  'Menunggu bayar': 'Menunggu pembayaran',
  'Perlu verifikasi': 'Sedang diverifikasi',
  Lunas: 'Lunas',
};

/** Status sewa di aplikasi (enum RentalStatus di Flutter), diturunkan dari keputusan admin + status tagihan. */
export type RentalStatus = 'pending' | 'approved' | 'paid' | 'rejected';

type RentalState = { approval: Approval; invoice_payment: PaymentStatus | null };

export const rentalStatusOf = (r: RentalState): RentalStatus =>
  r.approval === 'Ditolak' ? 'rejected' : r.approval === 'Perlu ditinjau' ? 'pending' : r.invoice_payment === 'Lunas' ? 'paid' : 'approved';

export const rentalStatusLabel = (status: RentalStatus, payment: PaymentStatus | null) =>
  ({
    pending: 'Menunggu Verifikasi',
    approved: payment === 'Perlu verifikasi' ? 'Disetujui · Pembayaran Diverifikasi' : 'Disetujui · Belum Bayar',
    paid: 'Disetujui · Lunas',
    rejected: 'Ditolak',
  })[status];

/** Kunci perubahan yang dipantau untuk notifikasi sewa (kolom notified_status): status + status bayar tagihan. */
export const rentalNoticeKey = (r: RentalState) => `${rentalStatusOf(r)}|${r.invoice_payment ?? ''}`;
