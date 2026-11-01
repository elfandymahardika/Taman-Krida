import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import { assertValid, badRequest, HttpError, notFound, queryText, where } from '../lib/http';
import { checkMediaMeta } from '../middleware/validator';
import { storageService } from '../services/storage.service';
import { createMedia, deleteMedia, findMediaById, listMedia, toMedia, updateMediaMeta, updateMediaStatus } from '../models/mediaModel';

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

const UNSUPPORTED = 'Format berkas harus foto (JPG, PNG, WEBP, GIF) atau video (MP4, WEBM, MOV).';
const todayWib = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

async function mustFind(id: string) {
  const m = await findMediaById(id);
  if (!m) throw notFound('Media');
  return m;
}

/** Virtual galeri: ?status=&type=&collection= */
export const getMedia = async (req: Request, res: Response) => {
  const [status, type, collection] = ['status', 'type', 'collection'].map((k) => queryText(req.query[k]));
  const filter = where([status && ['status = ?', status], type && ['type = ?', type], collection && ['collection = ?', collection]]);
  res.json((await listMedia(filter)).map(toMedia));
};

/**
 * Unggah: POST /api/media?name=&collection=&description= dengan isi permintaan berupa
 * berkas mentah (Content-Type image/* atau video/*), dibaca oleh express.raw() di routes/api.ts.
 */
export const uploadMedia = async (req: Request, res: Response) => {
  const mime = String(req.get('content-type') ?? '').split(';')[0].toLowerCase();
  if (!Buffer.isBuffer(req.body)) throw new HttpError(415, UNSUPPORTED);
  if (!req.body.length) throw badRequest('Pilih berkas foto atau video.', { berkas: 'Pilih berkas foto atau video.' });
  if (!EXT[mime]) throw new HttpError(415, UNSUPPORTED);

  const original = queryText(req.query.name).trim() || `berkas.${EXT[mime]}`;
  const title = queryText(req.query.title).trim() || original.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  const { data: meta, errors } = checkMediaMeta({
    title,
    collection: queryText(req.query.collection),
    description: queryText(req.query.description),
    credit: res.locals.user.name,
    date: todayWib(),
  });
  assertValid(errors);

  // Simpan ke Vercel Blob (bila BLOB_READ_WRITE_TOKEN diisi) atau folder uploads/; kuncinya dicatat di kolom `file`.
  const stored = await storageService.uploadFile(req.body, original, mime, 'galeri');
  const id = `m${Date.now().toString(36)}${randomBytes(2).toString('hex')}`;
  try {
    await createMedia({
      id,
      ...meta,
      description: meta.description || null,
      type: mime.startsWith('video/') ? 'Video' : 'Foto',
      file: stored.fileKey,
      mime,
      bytes: req.body.length,
    });
  } catch (error) {
    // Rollback anti-file yatim: berkas dihapus bila metadata gagal disimpan.
    await storageService.deleteFile(stored.fileKey);
    throw error;
  }
  await logActivity('gallery', 'Media diunggah ke virtual galeri', `${res.locals.user.name} · ${meta.title}`);
  res.status(201).json(toMedia((await findMediaById(id))!));
};

/** Ubah metadata (sudah divalidasi validateMediaMeta). */
export const editMedia = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  const { title, collection, description, credit, date } = req.body;
  await updateMediaMeta(current.id, { title, collection, description: description || null, credit, date });
  await logActivity('gallery', 'Metadata media diperbarui', `${res.locals.user.name} · ${title}`);
  res.json(toMedia((await findMediaById(current.id))!));
};

export const setMediaStatus = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  const status = req.body?.status;
  if (!['Terpublikasi', 'Draf'].includes(status)) assertValid({ status: 'Status harus Terpublikasi atau Draf.' });
  await updateMediaStatus(current.id, status);
  await logActivity('gallery', status === 'Terpublikasi' ? 'Media diterbitkan' : 'Publikasi media ditarik', `${res.locals.user.name} · ${current.title}`);
  res.json(toMedia((await findMediaById(current.id))!));
};

export const removeMedia = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  await deleteMedia(current.id);
  if (current.file) await storageService.deleteFile(current.file);
  await logActivity('gallery', 'Media dihapus', `${res.locals.user.name} · ${current.title}`);
  res.status(204).end();
};
