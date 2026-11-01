import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const root = path.resolve(__dirname, '../..');

/** Konfigurasi aplikasi dari environment variable (.env). Koneksi database ada di config/db.ts. */
export const config = {
  port: Number(process.env.PORT || 5001),
  jwtSecret: process.env.JWT_SECRET || 'tkbj-mobile-dev-secret-ganti-di-produksi',
  /** Klaim `aud` token pengunjung, agar token staf dashboard tidak bisa dipakai di sini (dan sebaliknya). */
  jwtAudience: 'tkbj-mobile',
  /** Masa berlaku login di aplikasi (hari). */
  sessionDays: Number(process.env.SESSION_DAYS || 30),
  /** Origin browser yang boleh memanggil API. Kosong = semua (token dikirim lewat header, bukan cookie). */
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /** Folder privat berkas sewa & bukti transfer (tidak disajikan statis). */
  uploadsDir: path.resolve(root, process.env.UPLOADS_DIR || 'uploads'),
  /** Alamat publik API dashboard: foto galeri unggahan admin disajikan di `<url>/uploads/...`. */
  adminPublicUrl: (process.env.ADMIN_PUBLIC_URL || 'http://localhost:5000').replace(/\/+$/, ''),
  /** "Hari ini" pada data contoh (YYYY-MM-DD), sama dengan API dashboard. */
  today: process.env.APP_TODAY || '2026-10-02',
};

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET wajib diisi di lingkungan produksi.');
}
