import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/http';
import { logger } from '../logger';

/** Rute yang tidak terdaftar → 404 JSON (bukan 500). */
export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) =>
  next(new HttpError(404, 'Endpoint tidak ditemukan.'));

/**
 * Penangan error terakhir, dipasang PALING AKHIR di app.ts. Express mengenalinya dari jumlah argumen (4).
 * - Error yang dikenal (HttpError dari lib/http.ts, JSON rusak, body terlalu besar, error 4xx bawaan Express)
 *   → status 4xx dengan pesannya.
 * - Error tak terduga → 500 dengan pesan umum. Detail + stack trace hanya masuk log, tidak pernah ke klien.
 * Format respons tetap `{ error, fields? }` ditambah `requestId` yang sama dengan header X-Request-Id dan baris log.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Respons sudah mulai terkirim (mis. stream berkas putus di tengah): status tidak bisa diubah lagi,
  // jadi catat lalu serahkan ke penangan bawaan Express yang menutup koneksinya.
  if (res.headersSent) {
    (req.log ?? logger).error({ err }, 'Error setelah respons mulai terkirim');
    return next(err);
  }

  if (err.type === 'entity.parse.failed') err = new HttpError(400, 'Format JSON tidak valid.');
  else if (err.type === 'entity.too.large') err = new HttpError(413, 'Isi permintaan terlalu besar.');
  // Error 4xx lain dari Express/body-parser (mis. charset tidak didukung) tetap 4xx, bukan 500.
  else if (!(err instanceof HttpError) && err.expose && err.status >= 400 && err.status < 500) err = new HttpError(err.status, 'Permintaan tidak valid.');

  const status = err instanceof HttpError ? err.status : 500;
  if (status === 500) {
    // pino-http mencatat `res.err` (beserta stack) pada baris log permintaan ini; tanpa logger permintaan, catat langsung.
    res.err = err;
    if (!req.log) logger.error({ err }, 'Error tak terduga');
  }
  res.status(status).json({
    error: status === 500 ? 'Terjadi kesalahan pada server.' : err.message,
    fields: err.fields,
    requestId: req.id,
  });
};
