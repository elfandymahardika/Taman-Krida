import { Request, Response } from 'express';
import { HttpError, notFound } from '../lib/http';
import { MAX_FILE_SIZE } from '../middleware/upload.middleware';
import {
  createDocument,
  deleteDocumentFromDb,
  getAllDocuments,
  getDocumentById,
  getDocumentsByUserId,
  toDocument,
} from '../models/documentModel';
import { storageService } from '../services/storage.service';

/*
 * Dokumen staf (Modul 03). Staf hanya melihat & menghapus dokumennya sendiri;
 * Administrator utama (role admin) boleh melihat dan menghapus semua dokumen (moderasi).
 */

const isAdmin = (res: Response) => res.locals.user.role_key === 'admin';

/** Nama asli dari multipart (latin1 di Multer) → UTF-8, dibatasi 255 karakter. */
const originalName = (name: string) => Buffer.from(name, 'latin1').toString('utf8').slice(0, 255);

/** POST /api/upload — file sudah divalidasi uploadMiddleware (tipe, ukuran, isi). */
export const handleUpload = async (req: Request, res: Response) => {
  const file = req.file!;

  // 1. Simpan fisik file ke storage (Cloud / lokal)
  const uploadResult = await storageService.uploadFile(file.buffer, originalName(file.originalname), file.mimetype);

  try {
    // 2. Simpan referensi metadata ke database SQL
    const doc = await createDocument({ ...uploadResult, userId: res.locals.userId });
    res.status(201).json({ message: 'File berhasil diunggah.', data: toDocument(doc) });
  } catch (dbError) {
    // 3. Rollback: hapus file fisik bila pencatatan database gagal, agar tidak ada file yatim.
    console.error('Gagal mencatat dokumen ke database, file diunggah dihapus kembali:', dbError);
    await storageService.deleteFile(uploadResult.fileKey);
    throw new HttpError(500, 'Gagal mencatat metadata dokumen ke database. File fisik telah dibersihkan.');
  }
};

/** GET /api/upload/list — milik sendiri; admin melihat semua. */
export const handleGetDocuments = async (_req: Request, res: Response) => {
  const docs = isAdmin(res) ? await getAllDocuments() : await getDocumentsByUserId(res.locals.userId);
  res.json({
    data: docs.map(toDocument),
    limits: { maxFileSize: MAX_FILE_SIZE, storage: storageService.mode },
  });
};

/** DELETE /api/upload/:id — anti-IDOR: hanya pemilik atau admin. */
export const handleDeleteDocument = async (req: Request<{ id: string }>, res: Response) => {
  const doc = await getDocumentById(req.params.id);

  // Dokumen orang lain dianggap tidak ada (404) agar ID dokumen milik user lain tidak bocor.
  if (!doc || (doc.userId !== res.locals.userId && !isAdmin(res))) throw notFound('Dokumen');

  // Hapus file fisik dulu, lalu record database.
  await storageService.deleteFile(doc.fileKey);
  await deleteDocumentFromDb(doc.id);
  res.json({ message: 'Dokumen berhasil dihapus dari storage dan database.' });
};
