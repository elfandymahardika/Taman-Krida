import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const root = path.resolve(__dirname, '../..');
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Nilai Express `trust proxy` dari TRUST_PROXY. Bawaan `loopback`: X-Forwarded-For hanya dipercaya bila permintaan
 * datang dari mesin yang sama (agen Ngrok), sehingga req.ip = IP pengguna asli, sementara klien luar yang langsung
 * memanggil API tidak bisa memalsukan IP lewat header itu.
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
  port: Number(process.env.PORT || 5001),
  trustProxy: trustProxy(process.env.TRUST_PROXY),
  /** Batas waktu graceful shutdown (ms) sebelum proses dipaksa keluar. Lihat server.ts. */
  shutdownTimeoutMs: Number(process.env.SHUTDOWN_TIMEOUT_MS || 10_000),
  /** Pembatas umum semua rute /api per IP (RATE_LIMIT_MAX permintaan per RATE_LIMIT_WINDOW_MIN menit). */
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MIN || 15) * 60_000,
    max: Number(process.env.RATE_LIMIT_MAX || 300),
  },
  jwtSecret: process.env.JWT_SECRET || 'tkbj-mobile-dev-secret-ganti-di-produksi',
  /** Klaim `aud` token pengunjung, agar token staf dashboard tidak bisa dipakai di sini (dan sebaliknya). */
  jwtAudience: 'tkbj-mobile',
  /** Masa berlaku login di aplikasi (hari). */
  sessionDays: Number(process.env.SESSION_DAYS || 30),
  /**
   * Origin browser (Flutter web) yang boleh memanggil API. Kosong = semua origin saat development, dan TIDAK ADA
   * origin browser di production (aplikasi Android/iOS tidak terkena CORS, jadi tetap berjalan).
   */
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /** Folder privat berkas sewa & bukti transfer (tidak disajikan statis). */
  uploadsDir: path.resolve(root, process.env.UPLOADS_DIR || 'uploads'),
  /** Alamat publik API dashboard: foto galeri unggahan admin disajikan di `<url>/uploads/...`. */
  adminPublicUrl: (process.env.ADMIN_PUBLIC_URL || 'http://localhost:5000').replace(/\/+$/, ''),
  /**
   * "Hari ini" (YYYY-MM-DD, zona WIB), dihitung ulang setiap kali dibaca agar ikut tanggal sebenarnya.
   * Isi APP_TODAY hanya untuk mengunci tanggal (mis. demo data contoh atau test); samakan dengan API dashboard.
   */
  get today(): string {
    return process.env.APP_TODAY || new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  },
  /** Asisten AI "Tanya Krida" (POST /api/assistant/chat). Kunci & model Gemini ada di assistantSettings(). */
  assistant: {
    /** Batas pertanyaan per IP: AI_RATE_LIMIT_MAX per AI_RATE_LIMIT_WINDOW_MIN menit (kuota/biaya API AI). */
    rateLimit: {
      windowMs: Number(process.env.AI_RATE_LIMIT_WINDOW_MIN || 15) * 60_000,
      max: Number(process.env.AI_RATE_LIMIT_MAX || 20),
    },
  },
};

/**
 * Pengaturan Google Gemini untuk Tanya Krida dari .env: GEMINI_API_KEY (Google AI Studio) dan AI_MODEL (opsional,
 * bawaan gemini-3.5-flash-lite yang punya kuota gratis harian terbesar). Kunci hanya ada di server, tidak pernah
 * dikirim ke aplikasi. Dibaca saat dipakai (bukan saat start) agar test bisa mengubahnya.
 * `apiKey` kosong = Tanya Krida nonaktif (503).
 */
export function assistantSettings() {
  return {
    model: process.env.AI_MODEL?.trim() || 'gemini-3.5-flash-lite',
    apiKey: process.env.GEMINI_API_KEY?.trim() || '',
  };
}

if (!process.env.JWT_SECRET && isProduction) {
  throw new Error('JWT_SECRET wajib diisi di lingkungan produksi.');
}
