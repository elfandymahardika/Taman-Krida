import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { RENTAL_DOCUMENTS } from '../lib/catalog';
import { badRequest, FieldErrors } from '../lib/http';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per berkas

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const INVALID_TYPE = 'Tipe file tidak diizinkan. Hanya menerima berkas JPG, PNG, WEBP, dan PDF.';

/** Tanda tangan biner (magic number) tiap format, agar file .exe yang diganti Content-Type-nya tetap ditolak. */
const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) => b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP',
  'application/pdf': (b) => b.toString('latin1', 0, 5) === '%PDF-',
};

// memoryStorage: file ditampung di Buffer untuk divalidasi dulu, baru ditulis ke folder privat oleh controller.
const multerFor = (files: number) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files, fields: 20 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) cb(null, true);
      else cb(Object.assign(new Error(INVALID_TYPE), { code: 'INVALID_FILE_TYPE', field: file.fieldname }));
    },
  });

/** Error Multer → 400 JSON dengan pesan pada kolom berkasnya. */
function uploadError(err: unknown, fallbackField: string) {
  if (err instanceof multer.MulterError) {
    const field = err.field ?? fallbackField;
    if (err.code === 'LIMIT_FILE_SIZE') return badRequest('Ukuran file melebihi batas maksimum 5 MB.', { [field]: 'Maksimal 5 MB.' });
    if (err.code === 'LIMIT_UNEXPECTED_FILE') return badRequest(`Kolom berkas "${field}" tidak dikenal.`, { [field]: 'Kolom berkas tidak dikenal.' });
    return badRequest(`Kesalahan upload: ${err.message}`, { [field]: err.message });
  }
  const { code, field } = err as { code?: string; field?: string };
  const message = code === 'INVALID_FILE_TYPE' ? INVALID_TYPE : 'Gagal memproses file upload.';
  return badRequest(message, { [field ?? fallbackField]: message });
}

/** Cek isi berkas sesuai tipenya (bukan sekadar Content-Type kiriman klien). */
const signatureOk = (file: Express.Multer.File) => SIGNATURES[file.mimetype](file.buffer);

/** Satu berkas bukti transfer di field "file" (multipart/form-data). */
export const proofUpload = (req: Request, res: Response, next: NextFunction) => {
  multerFor(1).single('file')(req, res, (err: unknown) => {
    if (err) return next(uploadError(err, 'file'));
    if (!req.file) return next(badRequest('Bukti transfer wajib diunggah (field "file").', { file: 'Unggah foto/PDF bukti transfer.' }));
    if (!signatureOk(req.file)) return next(badRequest(INVALID_TYPE, { file: 'Isi berkas tidak sesuai formatnya.' }));
    next();
  });
};

/**
 * Dokumen pengajuan sewa: field "ktp", "surat", dan "proposal" (multipart, bersama kolom formulir).
 * Kelengkapan berkas diperiksa validateRentalRequest bersama kolom lain, agar semua pesan tampil sekaligus.
 */
export const rentalDocumentsUpload = (req: Request, res: Response, next: NextFunction) => {
  const fields = RENTAL_DOCUMENTS.map((d) => ({ name: d.key, maxCount: 1 }));
  multerFor(fields.length).fields(fields)(req, res, (err: unknown) => {
    if (err) return next(uploadError(err, 'berkas'));
    const files = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
    const errors: FieldErrors = {};
    for (const doc of RENTAL_DOCUMENTS) {
      const file = files[doc.key]?.[0];
      if (file && !signatureOk(file)) errors[doc.key] = 'Isi berkas tidak sesuai formatnya.';
    }
    if (Object.keys(errors).length) return next(badRequest(INVALID_TYPE, errors));
    next();
  });
};
