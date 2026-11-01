// Dimuat sebelum test (lihat script "test"): pakai database & folder unggahan terpisah agar data development aman.
// dotenv tidak menimpa variabel yang sudah diisi di sini. Database test berisi tabel dashboard + tabel mobile.
import fs from 'fs';
import os from 'os';
import path from 'path';

process.env.DB_NAME = process.env.DB_NAME_TEST || 'tkbj_mobile_test';
process.env.UPLOADS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tkbj-mobile-uploads-'));
// API dashboard (diimpor test) membaca lampiran pengunjung dari folder yang sama.
process.env.MOBILE_UPLOADS_DIR = process.env.UPLOADS_DIR;
// Test tidak memakai Vercel Blob walau token ada di .env.
process.env.BLOB_READ_WRITE_TOKEN = '';
process.env.APP_TODAY = '2026-10-02';
