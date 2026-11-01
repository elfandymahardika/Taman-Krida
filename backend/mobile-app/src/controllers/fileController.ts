import { Request, Response } from 'express';
import { notFound } from '../lib/http';
import { openFile } from '../lib/storage';
import { findVisitorFile } from '../models/fileModel';

/**
 * Unduh berkas pengunjung (KTP, surat, proposal, bukti transfer) dari folder lokal atau Vercel Blob.
 * Berkas bersifat pribadi: tidak disajikan statis, hanya pemiliknya yang bisa mengunduh (milik orang lain → 404).
 */
export const downloadFile = async (req: Request<{ id: string }>, res: Response) => {
  const file = await findVisitorFile(res.locals.userId, req.params.id);
  const stream = file ? await openFile(file.file_key) : null;
  if (!file || !stream) throw notFound('Berkas');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  res.attachment(file.name);
  res.type(file.mime);
  stream.pipe(res);
};
