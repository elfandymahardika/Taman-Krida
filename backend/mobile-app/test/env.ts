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
// Log permintaan tidak dicetak saat test (lihat src/logger.ts).
process.env.LOG_LEVEL = 'silent';
// Seluruh test berjalan dari satu IP (localhost); batas umum /api dilonggarkan agar suite tidak terkena 429.
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || '5000';
// Tanya Krida: test tidak pernah memanggil API AI sungguhan. Test asisten memasang kunci palsu + server tiruan sendiri.
process.env.AI_MODEL = '';
process.env.GEMINI_API_KEY = '';
process.env.GEMINI_BASE_URL = '';
process.env.AI_RATE_LIMIT_MAX = process.env.AI_RATE_LIMIT_MAX || '5000';
