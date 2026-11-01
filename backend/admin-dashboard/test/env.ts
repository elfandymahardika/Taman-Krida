// Dimuat sebelum test (lihat script "test"): pakai database & folder unggahan terpisah agar data development aman.
// dotenv tidak menimpa variabel yang sudah diisi di sini.
import fs from 'fs';
import os from 'os';
import path from 'path';

process.env.DB_NAME = process.env.DB_NAME_TEST || 'tkbj_admin_test';
process.env.UPLOADS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tkbj-uploads-'));
