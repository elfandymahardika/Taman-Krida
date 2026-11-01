import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/http';

/*
 * Pembatas percobaan berulang (login & registrasi). Perlindungan tambahan terhadap tebak password dan
 * pendaftaran massal — bukan pengganti validasi. Disimpan di memori proses: cukup untuk satu server;
 * bila backend dijalankan di beberapa instance, pindahkan penyimpanannya ke Redis/database.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  /** Panjang jendela waktu. */
  windowMs: number;
  /** Jumlah permintaan yang dihitung per jendela sebelum ditolak 429. */
  max: number;
  /** Kunci penghitung, bawaan alamat IP. */
  key?: (req: Request) => string;
  /** true = hanya permintaan yang gagal (status ≥ 400) yang dihitung, mis. login salah. */
  skipSuccessful?: boolean;
  message: string;
}

const minutesLeft = (ms: number) => Math.max(1, Math.ceil(ms / 60_000));

/** Middleware pembatas: lebih dari `max` permintaan per `windowMs` per kunci → 429 + header Retry-After. */
export function rateLimit({ windowMs, max, key = (req) => req.ip ?? 'unknown', skipSuccessful = false, message }: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const id = key(req);
    let bucket = buckets.get(id);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(id, bucket);
    }
    if (bucket.count >= max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return next(new HttpError(429, `${message} Coba lagi dalam ${minutesLeft(bucket.resetAt - now)} menit.`));
    }
    bucket.count++;
    const counted = bucket;
    if (skipSuccessful) res.on('finish', () => res.statusCode < 400 && counted.count--);
    // Bersihkan penghitung kedaluwarsa sesekali agar Map tidak terus membesar.
    if (buckets.size > 10_000) for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    next();
  };
}

/** Login: maksimal 20 percobaan GAGAL per IP per 15 menit (login berhasil tidak dihitung). */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  skipSuccessful: true,
  message: 'Terlalu banyak percobaan login dari perangkat ini.',
});

/** Registrasi: maksimal 10 pendaftaran per IP per jam. */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60_000,
  max: 10,
  message: 'Terlalu banyak pendaftaran dari perangkat ini.',
});

const LOCK_MS = 15 * 60_000;
const failures = new Map<string, { count: number; lockedUntil?: number }>();

/**
 * Kunci AKUN (per email) setelah beberapa kali password salah, berlaku dari perangkat mana pun.
 * Batasnya diberikan pemanggil (authController: 5 kali).
 */
export const loginLockout = {
  /** Lempar 429 bila akun sedang terkunci. */
  assertOpen(username: string) {
    const record = failures.get(username);
    if (record?.lockedUntil && record.lockedUntil > Date.now()) {
      throw new HttpError(429, `Terlalu banyak percobaan gagal. Coba lagi dalam ${minutesLeft(record.lockedUntil - Date.now())} menit.`);
    }
  },
  /** Catat satu kegagalan; akun dikunci 15 menit setelah `limit` kali. */
  fail(username: string, limit: number) {
    const record = failures.get(username);
    const count = (record?.lockedUntil ? 0 : (record?.count ?? 0)) + 1;
    failures.set(username, count >= limit ? { count, lockedUntil: Date.now() + LOCK_MS } : { count });
  },
  reset(username: string) {
    failures.delete(username);
  },
};
