import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { del, get, put } from '@vercel/blob';
import { config } from '../config/env';

export interface StorageUploadResult {
  name: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  url: string;
}

/** Ekstensi file ditentukan dari MIME yang sudah lolos validasi, bukan dari nama file kiriman klien. */
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

/** Berkas di Vercel Blob dikenali dari kuncinya yang berupa URL. */
export const isCloudKey = (fileKey: string) => /^https?:\/\//.test(fileKey);

/** URL tampil sebuah berkas: URL blob apa adanya, berkas lokal disajikan di /uploads/<nama>. */
export const publicUrl = (fileKey: string) => (isCloudKey(fileKey) ? fileKey : `/uploads/${path.basename(fileKey)}`);

/**
 * Storage dual-mode:
 * - Cloud (Vercel Blob) bila BLOB_READ_WRITE_TOKEN diisi di .env → fileKey = URL blob.
 * - Lokal (folder uploads/, default & ramah praktikum offline) → fileKey = nama file, url = /uploads/<nama file>.
 * URL lokal sengaja relatif agar tetap benar saat backend diakses lewat proxy Next.js atau Ngrok.
 */
export class StorageService {
  private get cloudToken() {
    return process.env.BLOB_READ_WRITE_TOKEN || '';
  }

  get mode() {
    return this.cloudToken ? 'cloud' : 'local';
  }

  /** `folder` = awalan nama di Vercel Blob, mis. "documents" (dokumen staf) atau "galeri" (foto/video). */
  public async uploadFile(fileBuffer: Buffer, originalName: string, mimeType: string, folder = 'documents'): Promise<StorageUploadResult> {
    // Nama file acak (timestamp + hash) + nama asli yang disanitasi → tidak bisa bertabrakan / path traversal.
    const ext = EXT_BY_MIME[mimeType] ?? '';
    const cleanBaseName = path
      .basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 50);
    const uniqueHash = crypto.randomBytes(4).toString('hex');
    const safeFilename = `${Date.now()}-${uniqueHash}-${cleanBaseName || 'berkas'}${ext}`;

    // 1. Cloud Storage (jika token terpasang)
    if (this.cloudToken) {
      const blob = await put(`${folder}/${safeFilename}`, fileBuffer, {
        access: 'public',
        contentType: mimeType,
        token: this.cloudToken,
      });
      return { name: originalName, fileKey: blob.url, fileType: mimeType, fileSize: fileBuffer.length, url: blob.url };
    }

    // 2. Fallback penyimpanan lokal
    await fs.promises.mkdir(config.uploadsDir, { recursive: true });
    await fs.promises.writeFile(path.join(config.uploadsDir, safeFilename), fileBuffer);
    return {
      name: originalName,
      fileKey: safeFilename,
      fileType: mimeType,
      fileSize: fileBuffer.length,
      url: `/uploads/${safeFilename}`,
    };
  }

  public async deleteFile(fileKey: string): Promise<void> {
    // File cloud dikenali dari kuncinya yang berupa URL.
    if (isCloudKey(fileKey)) {
      if (this.cloudToken) await del(fileKey, { token: this.cloudToken });
      return;
    }

    // Mencegah path traversal dengan path.basename
    const filePath = path.join(config.uploadsDir, path.basename(fileKey));
    await fs.promises.rm(filePath, { force: true });
  }
}

export const storageService = new StorageService();

/**
 * Buka berkas yang diunggah pengunjung lewat aplikasi mobile (disimpan backend/mobile-app):
 * URL Vercel Blob (akses `private`, dibaca dengan token yang sama) atau nama berkas di MOBILE_UPLOADS_DIR.
 * Hanya dipanggil controller yang sudah memeriksa hak akses admin. null bila berkas tidak ditemukan.
 */
export async function openVisitorFile(fileKey: string): Promise<Readable | null> {
  if (isCloudKey(fileKey)) {
    const access = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';
    const result = await get(fileKey, { access, token: process.env.BLOB_READ_WRITE_TOKEN || undefined });
    if (!result || result.statusCode !== 200) return null;
    return Readable.fromWeb(result.stream as import('stream/web').ReadableStream);
  }
  const local = path.join(config.mobileUploadsDir, path.basename(fileKey));
  return fs.existsSync(local) ? fs.createReadStream(local) : null;
}
