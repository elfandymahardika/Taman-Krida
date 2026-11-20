import dotenv from 'dotenv';

// Membaca environment variables dari file .env
dotenv.config({ quiet: true });

import app from './app';
import pool from './config/db';
import { config } from './config/env';
import { startDraining } from './lib/health';
import prisma from './lib/prisma';
import { logger } from './logger';

const PORT = config.port;

// Menguji koneksi database pool dan menjalankan server
const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info(`✓ Database MySQL Connection Pool berhasil terhubung (${process.env.DB_NAME || 'tkbj_admin'}).`);
    connection.release();
  } catch (error) {
    logger.error({ err: error }, '✗ Peringatan: Gagal terhubung ke MySQL. Pastikan MySQL (XAMPP) menyala dan sudah `npm run migrate`.');
  }

  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server Express berjalan di http://localhost:${PORT}`);
    logger.info(`📡 Rute API siap di http://localhost:${PORT}/api`);
  });

  // Keep-alive Node lebih lama dari Nginx (bawaan 60–75 dtk) agar Nginx yang menutup koneksi duluan (mencegah 502 acak).
  server.keepAliveTimeout = 76_000;
  server.headersTimeout = 77_000;

  /*
   * Graceful shutdown. Docker/orchestrator mengirim SIGTERM saat rilis versi baru (Ctrl+C = SIGINT saat development):
   * 1. /health langsung menjawab 503 → Nginx/load balancer berhenti mengirim trafik baru ke instance ini;
   * 2. server.close() berhenti menerima koneksi baru, tetapi MENUNGGU permintaan yang sedang berjalan selesai;
   *    koneksi keep-alive yang menganggur ditutup agar tidak menahan proses;
   * 3. setelah semua selesai, pool MySQL & Prisma ditutup rapi, lalu proses keluar dengan kode 0;
   * 4. bila masih ada permintaan menggantung lebih dari SHUTDOWN_TIMEOUT_MS, proses dipaksa keluar (kode 1).
   * Batas ini harus di bawah `stop_grace_period` Docker (docker-compose.yml) agar tidak di-SIGKILL duluan.
   */
  let stopping = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (stopping) return;
    stopping = true;
    logger.info({ signal }, `Menerima ${signal}: berhenti menerima permintaan baru, menyelesaikan yang sedang berjalan...`);
    startDraining();

    const force = setTimeout(() => {
      logger.error(`Graceful shutdown melewati ${config.shutdownTimeoutMs} ms, proses dihentikan paksa.`);
      process.exit(1);
    }, config.shutdownTimeoutMs);
    force.unref();

    server.close(async (err) => {
      const results = await Promise.allSettled([pool.end(), prisma.$disconnect()]);
      for (const r of results) if (r.status === 'rejected') logger.error({ err: r.reason }, 'Gagal menutup koneksi database');
      logger.info('Server berhenti dengan rapi.');
      process.exit(err ? 1 : 0);
    });
    server.closeIdleConnections();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer();
