import type { Request, Response } from 'express';
import pool from '../config/db';
import { config } from '../config/env';
import { logger } from '../logger';

const SERVICE = 'tkbj-mobile-api';
/** Batas waktu ping database; health check tidak boleh ikut menggantung bila MySQL macet. */
const DB_TIMEOUT_MS = 2000;

let draining = false;

/**
 * Dipanggil server.ts saat menerima SIGTERM/SIGINT: /health langsung menjawab 503 sehingga load balancer / Nginx /
 * Docker berhenti mengirim trafik baru ke instance ini, sementara permintaan yang sedang berjalan tetap diselesaikan.
 */
export const startDraining = () => {
  draining = true;
};

const pingDatabase = async () => {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Database tidak menjawab dalam ${DB_TIMEOUT_MS} ms`)), DB_TIMEOUT_MS);
  });
  try {
    await Promise.race([pool.query('SELECT 1'), timeout]);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Health check untuk Docker HEALTHCHECK, Nginx, dan skrip deploy (zero-downtime): 200 hanya bila aplikasi berjalan
 * DAN koneksi ke MySQL sehat. 503 bila database putus atau instance sedang dimatikan, agar versi baru yang gagal
 * terhubung ke database tidak pernah menerima trafik (versi lama tetap jalan = rollback aman).
 */
export const healthCheck = async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  const base = { service: SERVICE, uptime: Math.round(process.uptime()), today: config.today };
  if (draining) {
    return res.status(503).json({ ok: false, status: 'shutting_down', ...base, database: 'skipped' });
  }
  const started = Date.now();
  try {
    await pingDatabase();
    res.json({ ok: true, status: 'ok', ...base, database: 'up', dbLatencyMs: Date.now() - started });
  } catch (err) {
    logger.warn({ err }, 'Health check gagal: database tidak dapat dihubungi');
    res.status(503).json({ ok: false, status: 'error', ...base, database: 'down' });
  }
};
