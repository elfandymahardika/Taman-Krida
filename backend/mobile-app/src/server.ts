import dotenv from 'dotenv';

// Membaca environment variables dari file .env
dotenv.config({ quiet: true });

import app from './app';
import pool from './config/db';
import { config } from './config/env';

const PORT = config.port;

// Menguji koneksi database pool dan menjalankan server
const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✓ Database MySQL Connection Pool berhasil terhubung (${process.env.DB_NAME || 'tkbj_admin'}).`);
    connection.release();
  } catch (error) {
    console.error('✗ Peringatan: Gagal terhubung ke MySQL. Pastikan MySQL (XAMPP) menyala dan sudah `npm run migrate`.', error);
  }

  // 0.0.0.0: bisa diakses dari HP/emulator di jaringan yang sama (Android emulator memakai http://10.0.2.2:5001).
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server Express berjalan di http://localhost:${PORT}`);
    console.log(`📡 Rute API siap di http://localhost:${PORT}/api`);
  });

  const shutdown = () => {
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer();
