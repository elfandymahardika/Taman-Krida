import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { HttpError } from '../lib/http';

/*
 * Pembatas permintaan berulang → 429 Too Many Requests. Perlindungan tambahan terhadap banjir permintaan,
 * tebak password, dan pendaftaran massal — bukan pengganti validasi.
 * - apiLimiter      : batas umum semua rute /api (dipasang di app.ts).
 * - loginLimiter    : endpoint sensitif, hanya percobaan login GAGAL yang dihitung.
 * - registerLimiter : endpoint sensitif, pendaftaran per IP.
 * Kunci penghitung = req.ip; di belakang proxy (Next.js, Ngrok) nilainya IP pengguna asli berkat `trust proxy`
 * (config.trustProxy), jadi staf tidak saling memblokir walau semua permintaan lewat server Next.js.
 * Penghitung disimpan di memori proses: cukup untuk satu server. Bila backend dijalankan di beberapa instance,
 * pindahkan penyimpanannya ke store bersama (Redis/database) agar batasnya berlaku gabungan.
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

/**
 * Middleware pembatas: lebih dari `max` permintaan per `windowMs` per kunci → 429 + header Retry-After.
 * Setiap respons membawa header RateLimit-Limit / RateLimit-Remaining / RateLimit-Reset (detik).
 */
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
    const resetSeconds = String(Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - bucket.count - 1)));
    res.setHeader('RateLimit-Reset', resetSeconds);
    if (bucket.count >= max) {
      res.setHeader('Retry-After', resetSeconds);
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

/** Batas umum semua rute /api per IP (RATE_LIMIT_MAX per RATE_LIMIT_WINDOW_MIN menit, lihat config/env.ts). */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Terlalu banyak permintaan dari perangkat ini.',
});

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
 * Kunci AKUN (per username) setelah beberapa kali password salah, berlaku dari perangkat mana pun.
 * Batasnya mengikuti Pengaturan → Keamanan → Batas percobaan login.
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
