import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { badRequest } from '../lib/http';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const INVALID_TYPE = 'Tipe file tidak diizinkan. Hanya menerima berkas JPG, PNG, WEBP, dan PDF.';

/** Tanda tangan biner (magic number) tiap format, agar file .exe yang diganti Content-Type-nya tetap ditolak. */
const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) => b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP',
  'application/pdf': (b) => b.toString('latin1', 0, 5) === '%PDF-',
};

// memoryStorage: file ditampung sementara di Buffer RAM untuk divalidasi lalu dikirim ke storage service.
const rawUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(Object.assign(new Error(INVALID_TYPE), { code: 'INVALID_FILE_TYPE' }));
  },
}).single('file');

/**
 * Pembungkus Multer: semua error upload (ukuran > 5 MB, tipe tidak sah, field salah) dikembalikan
 * sebagai 400 JSON lewat error handler, bukan crash 500.
 */
export const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  rawUpload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(badRequest('Ukuran file melebihi batas maksimum 5 MB.', { file: 'Maksimal 5 MB.' }));
      return next(badRequest(`Kesalahan upload: ${err.message}`, { file: err.message }));
    }
    if (err) {
      const message = (err as { code?: string }).code === 'INVALID_FILE_TYPE' ? INVALID_TYPE : 'Gagal memproses file upload.';
      return next(badRequest(message, { file: message }));
    }
    if (!req.file) return next(badRequest('File tidak ditemukan dalam request form-data (field "file").', { file: 'Pilih berkas.' }));
    if (!SIGNATURES[req.file.mimetype](req.file.buffer)) return next(badRequest(INVALID_TYPE, { file: 'Isi berkas tidak sesuai formatnya.' }));
    next();
  });
};
