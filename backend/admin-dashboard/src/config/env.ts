import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const root = path.resolve(__dirname, '../..');
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Nilai Express `trust proxy` dari TRUST_PROXY. Bawaan `loopback`: X-Forwarded-For hanya dipercaya bila permintaan
 * datang dari mesin yang sama (proxy Next.js /api/be atau agen Ngrok), sehingga req.ip = IP pengguna asli,
 * sementara klien luar yang langsung memanggil API tidak bisa memalsukan IP lewat header itu.
 * `false` = tanpa proxy, angka = jumlah hop proxy (mis. `1` di hosting), atau daftar IP/subnet proxy.
 */
function trustProxy(value = 'loopback'): boolean | number | string {
  const v = value.trim();
  if (v === '' || v === 'false') return false;
  if (v === 'true') return true;
  return /^\d+$/.test(v) ? Number(v) : v;
}

/** Konfigurasi aplikasi dari environment variable (.env). Koneksi database ada di config/db.ts. */
export const config = {
  isProduction,
  port: Number(process.env.PORT || 5000),
  trustProxy: trustProxy(process.env.TRUST_PROXY),
  /** Batas waktu graceful shutdown (ms) sebelum proses dipaksa keluar. Lihat server.ts. */
  shutdownTimeoutMs: Number(process.env.SHUTDOWN_TIMEOUT_MS || 10_000),
  /**
   * Pembatas umum semua rute /api per IP (RATE_LIMIT_MAX permintaan per RATE_LIMIT_WINDOW_MIN menit).
   * Bawaan 1000/15 menit: dashboard memuat ulang beberapa data tiap 30 detik, dan staf satu kantor bisa berbagi IP.
   * Login & registrasi punya batas sendiri yang jauh lebih ketat (middleware/rateLimiter.ts).
   */
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MIN || 15) * 60_000,
    max: Number(process.env.RATE_LIMIT_MAX || 1000),
  },
  jwtSecret: process.env.JWT_SECRET || 'tkbj-dev-secret-ganti-di-produksi',
  /** Origin frontend yang boleh memanggil API (FRONTEND_URL, pisahkan dengan koma). */
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((s) => s.trim()),
  /** Folder berkas galeri yang diunggah (disajikan di /uploads). */
  uploadsDir: path.resolve(root, process.env.UPLOADS_DIR || 'uploads'),
  /** Ukuran maksimal satu berkas unggahan galeri. */
  uploadLimitMb: Number(process.env.UPLOAD_LIMIT_MB || 25),
  /**
   * Folder berkas privat API mobile (bukti bayar, KTP, surat, proposal) saat tidak memakai Vercel Blob,
   * agar admin bisa membuka lampiran. Harus sama dengan UPLOADS_DIR di backend/mobile-app.
   */
  mobileUploadsDir: path.resolve(root, process.env.MOBILE_UPLOADS_DIR || '../mobile-app/uploads'),
  /**
   * "Hari ini" (YYYY-MM-DD, zona WIB), dihitung ulang setiap kali dibaca agar ikut tanggal sebenarnya.
   * Isi APP_TODAY hanya untuk mengunci tanggal (mis. demo data contoh atau test).
   */
  get today(): string {
    return process.env.APP_TODAY || new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  },
};

if (!process.env.JWT_SECRET && isProduction) {
  throw new Error('JWT_SECRET wajib diisi di lingkungan produksi.');
}
// Production: origin CORS harus ditulis jelas (tidak memakai bawaan localhost, tidak boleh "*").
if (isProduction && (!process.env.FRONTEND_URL || config.frontendUrls.includes('*'))) {
  throw new Error('FRONTEND_URL wajib diisi origin frontend yang jelas (bukan "*") di lingkungan produksi.');
}
