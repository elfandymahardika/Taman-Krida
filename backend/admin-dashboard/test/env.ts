// Dimuat sebelum test (lihat script "test"): pakai database & folder unggahan terpisah agar data development aman.
// dotenv tidak menimpa variabel yang sudah diisi di sini.
import fs from 'fs';
import os from 'os';
import path from 'path';

process.env.DB_NAME = process.env.DB_NAME_TEST || 'tkbj_admin_test';
process.env.UPLOADS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tkbj-uploads-'));
// Test tidak memakai Vercel Blob walau token ada di .env.
process.env.BLOB_READ_WRITE_TOKEN = '';
// Test memakai data contoh Oktober 2026, jadi "hari ini" dikunci (aplikasi biasa memakai tanggal sebenarnya).
process.env.APP_TODAY = '2026-10-02';
// Log permintaan tidak dicetak saat test (lihat src/logger.ts).
process.env.LOG_LEVEL = 'silent';
// Seluruh test berjalan dari satu IP (localhost); batas umum /api dilonggarkan agar suite tidak terkena 429.
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || '5000';
