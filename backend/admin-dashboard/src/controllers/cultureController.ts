import { Request, Response } from 'express';
import { config } from '../config/env';
import { logActivity } from '../lib/activity';
import { badRequest, HttpError, notFound, queryText } from '../lib/http';
import { matchesSignature, MAX_FILE_SIZE } from '../middleware/upload.middleware';
import { CULTURE_STATUSES } from '../middleware/validator';
import { storageService } from '../services/storage.service';
import {
  createCultureTopic,
  CultureInput,
  CultureTopic,
  cultureIdExists,
  deleteCultureTopic,
  findCultureTopic,
  imagesOf,
  isBuiltinPhoto,
  listCultureTopics,
  setCultureImages,
  setCultureStatus,
  setCultureVideo,
  toCulture,
  updateCultureTopic,
} from '../models/cultureModel';

/*
 * Materi Edukasi Budaya untuk aplikasi mobile (menu Edukasi di dashboard).
 * Aplikasi hanya menampilkan materi berstatus Terpublikasi (GET /api/culture di backend mobile).
 */

/** Batas jumlah foto per materi (tab Foto/Video di aplikasi). */
export const MAX_CULTURE_IMAGES = 8;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_ERROR = 'Foto harus berformat JPG, PNG, atau WEBP.';

/** Berkas unggahan gagal dihapus tidak boleh menggagalkan permintaan (data materi sudah benar). */
const removeStoredImages = (keys: string[]) =>
  Promise.all(keys.filter((k) => !isBuiltinPhoto(k)).map((k) => storageService.deleteFile(k).catch(() => undefined)));

const mustFind = async (id: string) => {
  const topic = await findCultureTopic(id);
  if (!topic) throw notFound('Materi edukasi');
  return topic;
};

const respond = async (res: Response, id: string, status = 200) => res.status(status).json(toCulture((await findCultureTopic(id))!));

/** "Tari Topeng Malangan" → "tari-topeng-malangan"; dipakai juga oleh asisten AI & tautan aplikasi. */
const slugOf = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'materi';

const uniqueId = async (title: string) => {
  const base = slugOf(title);
  for (let n = 1; ; n++) {
    const id = n === 1 ? base : `${base}-${n}`;
    if (!(await cultureIdExists(id))) return id;
  }
};

export const getCultureTopics = async (_req: Request, res: Response) => {
  res.json((await listCultureTopics()).map(toCulture));
};

/** Data sudah divalidasi validateCulture → req.body.culture. */
export const addCultureTopic = async (req: Request, res: Response) => {
  const data: CultureInput = req.body.culture;
  const id = await uniqueId(data.title);
  await createCultureTopic(id, data, res.locals.user.name);
  await logActivity('content', 'Materi edukasi ditambahkan', `${res.locals.user.name} · ${data.title}`);
  await respond(res, id, 201);
};

export const editCultureTopic = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  const data: CultureInput = req.body.culture;
  await updateCultureTopic(current.id, data, res.locals.user.name);
  await logActivity('content', 'Materi edukasi diperbarui', `${res.locals.user.name} · ${data.title}`);
  await respond(res, current.id);
};

/**
 * Perubahan cepat: `status` (terbitkan/tarik) dan/atau `images` (urutan baru foto yang ada; foto yang
 * tidak dikirim lagi dihapus). Foto baru hanya lewat POST /culture/:id/images.
 */
export const patchCultureTopic = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  const { status, images } = req.body ?? {};
  if (status === undefined && images === undefined) throw badRequest('Tidak ada perubahan yang dikirim.');
  if (status !== undefined && !CULTURE_STATUSES.includes(status)) throw badRequest('Status tidak dikenal.', { status: 'Status tidak dikenal.' });

  let removed: string[] = [];
  if (images !== undefined) {
    const existing = imagesOf(current);
    const valid =
      Array.isArray(images) && images.every((k) => typeof k === 'string' && existing.includes(k)) && new Set(images).size === images.length;
    if (!valid) throw badRequest('Daftar foto hanya boleh berisi foto materi ini.', { images: 'Daftar foto tidak valid.' });
    removed = existing.filter((k) => !images.includes(k));
    await setCultureImages(current.id, images);
  }
  if (status !== undefined) await setCultureStatus(current.id, status, res.locals.user.name);
  await removeStoredImages(removed);

  const by = `${res.locals.user.name} · ${current.title}`;
  if (status !== undefined && status !== current.status)
    await logActivity('content', status === 'Terpublikasi' ? 'Materi edukasi diterbitkan' : 'Publikasi materi edukasi ditarik', by);
  if (images !== undefined) await logActivity('content', removed.length ? 'Foto materi edukasi dihapus' : 'Urutan foto materi edukasi diubah', by);
  await respond(res, current.id);
};

/**
 * Tambah foto: POST /api/culture/:id/images, isi permintaan = berkas mentah (image/jpeg|png|webp, maks. 5 MB)
 * dibaca express.raw() di routes/api.ts. Disimpan di Vercel Blob folder "edukasi" atau uploads/.
 * `?cover=1` menjadikan foto baru sebagai sampul (urutan pertama).
 */
export const uploadCultureImage = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  const images = imagesOf(current);
  if (images.length >= MAX_CULTURE_IMAGES) throw badRequest(`Maksimal ${MAX_CULTURE_IMAGES} foto per materi.`, { gambar: 'Hapus foto lain dulu.' });
  const mime = String(req.get('content-type') ?? '').split(';')[0].toLowerCase();
  if (!IMAGE_TYPES.includes(mime) || !Buffer.isBuffer(req.body)) throw new HttpError(415, IMAGE_ERROR);
  if (!req.body.length) throw badRequest('Pilih berkas foto.', { gambar: 'Pilih berkas foto.' });
  if (req.body.length > MAX_FILE_SIZE) throw badRequest('Ukuran foto maksimal 5 MB.', { gambar: 'Maksimal 5 MB.' });
  if (!matchesSignature(mime, req.body)) throw badRequest(IMAGE_ERROR, { gambar: 'Isi berkas bukan gambar yang valid.' });

  const stored = await storageService.uploadFile(req.body, queryText(req.query.name) || `edukasi-${current.id}`, mime, 'edukasi');
  try {
    await setCultureImages(current.id, queryText(req.query.cover) === '1' ? [stored.fileKey, ...images] : [...images, stored.fileKey]);
  } catch (error) {
    // Rollback anti-file yatim: berkas baru dihapus bila data gagal disimpan.
    await removeStoredImages([stored.fileKey]);
    throw error;
  }
  await logActivity('content', 'Foto materi edukasi ditambahkan', `${res.locals.user.name} · ${current.title}`);
  await respond(res, current.id);
};

// ------------------------------------------------------------------ Video materi

/** Format video yang diterima; isi berkas dicek (bukan hanya Content-Type). */
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const VIDEO_ERROR = 'Video harus berformat MP4, WEBM, atau MOV.';
const isVideo = (mime: string, b: Buffer) =>
  mime === 'video/webm'
    ? b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
    : ['ftyp', 'moov', 'mdat', 'wide', 'free'].includes(b.toString('latin1', 4, 8));

/** Video berkas lama dihapus dari penyimpanan saat diganti/dihapus (kegagalan diabaikan). */
const removeStoredVideo = (c: CultureTopic) => (c.video_file ? storageService.deleteFile(c.video_file).catch(() => undefined) : undefined);

/**
 * Unggah video: POST /api/culture/:id/video, isi permintaan = berkas mentah (video/mp4|webm|quicktime,
 * maks. UPLOAD_LIMIT_MB). Menggantikan video sebelumnya (berkas maupun tautan).
 */
export const uploadCultureVideo = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  const mime = String(req.get('content-type') ?? '').split(';')[0].toLowerCase();
  if (!VIDEO_TYPES.includes(mime) || !Buffer.isBuffer(req.body)) throw new HttpError(415, VIDEO_ERROR);
  if (!req.body.length) throw badRequest('Pilih berkas video.', { videoFile: 'Pilih berkas video.' });
  if (!isVideo(mime, req.body)) throw badRequest(VIDEO_ERROR, { videoFile: 'Isi berkas bukan video yang valid.' });

  const stored = await storageService.uploadFile(req.body, queryText(req.query.name) || `video-${current.id}`, mime, 'edukasi');
  try {
    await setCultureVideo(current.id, { file: stored.fileKey, link: null });
  } catch (error) {
    await storageService.deleteFile(stored.fileKey).catch(() => undefined);
    throw error;
  }
  await removeStoredVideo(current);
  await logActivity('content', 'Video materi edukasi diunggah', `${res.locals.user.name} · ${current.title}`);
  await respond(res, current.id);
};

/** Tautan video yang diterima: https, maks. 500 karakter (YouTube, atau URL berkas .mp4/.webm). */
export const checkVideoLink = (value: unknown) => {
  const link = typeof value === 'string' ? value.trim() : '';
  if (!link) return { error: 'Tautan video wajib diisi.' };
  if (link.length > 500) return { error: 'Tautan maksimal 500 karakter.' };
  try {
    const url = new URL(link);
    if (url.protocol !== 'https:' || !url.hostname.includes('.')) throw new Error();
  } catch {
    return { error: 'Tautan harus diawali "https://", mis. https://www.youtube.com/watch?v=…' };
  }
  return { link };
};

/** Pakai tautan video: PUT /api/culture/:id/video { link }. Video berkas sebelumnya dihapus. */
export const setCultureVideoLink = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  const { link, error } = checkVideoLink(req.body?.link);
  if (error) throw badRequest(error, { videoLink: error });
  await setCultureVideo(current.id, { file: null, link: link! });
  await removeStoredVideo(current);
  if (link !== current.video_link) await logActivity('content', 'Tautan video materi edukasi diubah', `${res.locals.user.name} · ${current.title}`);
  await respond(res, current.id);
};

export const removeCultureVideo = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  if (current.video_file || current.video_link) {
    await setCultureVideo(current.id, { file: null, link: null });
    await removeStoredVideo(current);
    await logActivity('content', 'Video materi edukasi dihapus', `${res.locals.user.name} · ${current.title}`);
  }
  await respond(res, current.id);
};

/** Batas ukuran video untuk express.raw() di routes/api.ts. */
export const VIDEO_LIMIT = `${config.uploadLimitMb}mb`;

export const removeCultureTopic = async (req: Request<{ id: string }>, res: Response) => {
  const current: CultureTopic = await mustFind(req.params.id);
  await deleteCultureTopic(current.id);
  await removeStoredImages(imagesOf(current));
  await removeStoredVideo(current);
  await logActivity('content', 'Materi edukasi dihapus', `${res.locals.user.name} · ${current.title}`);
  res.status(204).end();
};
