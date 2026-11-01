import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/http';

/** Rute yang tidak terdaftar → 404 JSON. */
export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) =>
  next(new HttpError(404, 'Endpoint tidak ditemukan.'));

/**
 * Penangan error terakhir. Express mengenalinya dari jumlah argumen (4).
 * Error tak terduga → 500 tanpa membocorkan detail ke klien (detail dicatat di console).
 */
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.parse.failed') err = new HttpError(400, 'Format JSON tidak valid.');
  if (err.type === 'entity.too.large') err = new HttpError(413, 'Isi permintaan terlalu besar.');
  const status = err instanceof HttpError ? err.status : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Terjadi kesalahan pada server.' : err.message, fields: err.fields });
};
