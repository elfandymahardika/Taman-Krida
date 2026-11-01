import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const root = path.resolve(__dirname, '../..');

/** Konfigurasi aplikasi dari environment variable (.env). Koneksi database ada di config/db.ts. */
export const config = {
  port: Number(process.env.PORT || 5000),
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
  /** "Hari ini" pada data contoh (YYYY-MM-DD). */
  today: process.env.APP_TODAY || '2026-10-02',
};

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET wajib diisi di lingkungan produksi.');
}
