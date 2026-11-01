import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { del, get, put } from '@vercel/blob';
import { config } from '../config/env';
import { fileSize } from './format';

/*
 * Storage berkas pengunjung (KTP, surat, proposal, bukti bayar), dua mode:
 * - Vercel Blob bila BLOB_READ_WRITE_TOKEN diisi → file_key = URL blob. Akses bawaan `private`
 *   (BLOB_ACCESS), jadi URL-nya tidak bisa dibuka tanpa token; aplikasi & dashboard selalu mengunduh
 *   lewat backend yang memeriksa hak akses.
 * - Folder lokal UPLOADS_DIR (bawaan, untuk praktikum offline) → file_key = nama file acak.
 * Alurnya: pilih file → validasi (upload.middleware) → simpan ke storage → catat referensi di
 * visitor_files → tampilkan/tinjau lewat GET /api/files/:id (pemilik) atau API dashboard (admin).
 */

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

const blobToken = () => process.env.BLOB_READ_WRITE_TOKEN || '';
const blobAccess = () => (process.env.BLOB_ACCESS === 'public' ? 'public' : 'private') as 'public' | 'private';

/** Berkas di Vercel Blob dikenali dari kuncinya yang berupa URL. */
export const isBlobKey = (key: string) => /^https?:\/\//.test(key);

export const storageMode = () => (blobToken() ? 'vercel-blob' : 'local');

/** Nama asli dari multipart (latin1 di Multer) → UTF-8, dibatasi 255 karakter. */
export const originalName = (file: Express.Multer.File) => Buffer.from(file.originalname, 'latin1').toString('utf8').slice(0, 255);

/** Label berkas seperti di dashboard admin, mis. "proposal.pdf · 1,2 MB" (kolom 120 karakter). */
export const fileLabel = (file: Express.Multer.File) => {
  const size = ` · ${fileSize(file.size)}`;
  return originalName(file).slice(0, 120 - size.length) + size;
};

/** Lokasi berkas lokal. `basename` mencegah path traversal walau kunci selalu buatan server. */
export const filePath = (key: string) => path.join(config.uploadsDir, path.basename(key));

/** Simpan berkas (sudah lolos validasi) dengan nama acak; mengembalikan kunci untuk kolom file_key. */
export async function saveFile(file: Express.Multer.File) {
  const name = `${randomUUID()}${EXTENSIONS[file.mimetype] ?? ''}`;
  const token = blobToken();
  if (token) {
    const blob = await put(`tkbj-mobile/${name}`, file.buffer, { access: blobAccess(), contentType: file.mimetype, token });
    return blob.url;
  }
  await fs.promises.mkdir(config.uploadsDir, { recursive: true });
  await fs.promises.writeFile(filePath(name), file.buffer, { flag: 'wx' });
  return name;
}

/** Hapus berkas (rollback bila penyimpanan ke database gagal, agar tidak ada file yatim). */
export async function removeFiles(keys: string[]) {
  const blobs = keys.filter(isBlobKey);
  if (blobs.length && blobToken()) await del(blobs, { token: blobToken() });
  await Promise.all(keys.filter((k) => !isBlobKey(k)).map((key) => fs.promises.rm(filePath(key), { force: true })));
}

/** Buka isi berkas sebagai stream (lokal atau Vercel Blob); null bila tidak ditemukan. */
export async function openFile(key: string): Promise<Readable | null> {
  if (isBlobKey(key)) {
    const result = await get(key, { access: blobAccess(), token: blobToken() || undefined });
    if (!result || result.statusCode !== 200) return null;
    return Readable.fromWeb(result.stream as import('stream/web').ReadableStream);
  }
  const local = filePath(key);
  return fs.existsSync(local) ? fs.createReadStream(local) : null;
}
