import { Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import { shortDate } from '../lib/format';
import { assertValid, badRequest, conflict, FieldErrors, HttpError, likePattern, notFound, queryText, where } from '../lib/http';
import { matchesSignature, MAX_FILE_SIZE } from '../middleware/upload.middleware';
import { EVENT_STATUSES, parseQuota } from '../middleware/validator';
import { storageService } from '../services/storage.service';
import {
  deleteEvent,
  eventNameTaken,
  findEventById,
  listEvents,
  resetSampleEvents,
  sampleResetImages,
  setEventCategory,
  setEventImage,
  toEvent,
  updateEvent,
  updateEventInventory,
  upsertEvent,
} from '../models/eventModel';
import { countOrdersForEvent } from '../models/orderModel';

const DEFAULT_PRICE = 50000;

/** Harga dari formulir: kosong → `fallback`; 0 tetap 0 (tiket gratis, pengunjung ambil tiket tanpa bayar). */
const priceOr = (value: unknown, fallback: number) => (value === undefined || value === null || value === '' ? fallback : Number(value));

async function mustFind(id: string) {
  const event = await findEventById(id);
  if (!event) throw notFound('Acara');
  return event;
}

/** Daftar acara: ?from=&to=&status=&venue=&q= */
export const getEvents = async (req: Request, res: Response) => {
  const [from, to, status, venue, q] = ['from', 'to', 'status', 'venue', 'q'].map((k) => queryText(req.query[k]));
  const filter = where([
    from && ['date >= ?', from],
    to && ['date <= ?', to],
    status && ['status = ?', status],
    venue && ['venue = ?', venue],
    q && ['(name LIKE ? OR organizer LIKE ?)', likePattern(q), likePattern(q)],
  ]);
  res.json((await listEvents(filter)).map(toEvent));
};

export const getEvent = async (req: Request<{ id: string }>, res: Response) => {
  res.json(toEvent(await mustFind(req.params.id)));
};

export const createEvent = async (req: Request, res: Response) => {
  const data = req.body;
  if (await eventNameTaken(data.name, data.date)) assertValid({ name: 'Acara dengan nama yang sama sudah ada di tanggal ini.' });
  const quota = parseQuota(data.quota);
  const id = `e${Date.now().toString(36)}`;
  await upsertEvent({
    id,
    name: data.name,
    organizer: data.organizer,
    date: data.date,
    start: data.start,
    end: data.end,
    venue: data.venue,
    status: data.status ?? 'Draf',
    quota,
    sold: quota !== null ? 0 : null,
    price: quota !== null ? priceOr(data.price, DEFAULT_PRICE) : null,
  });
  if (data.category !== undefined) await setEventCategory(id, data.category);
  await logActivity('event', 'Acara baru ditambahkan', `${res.locals.user.name} · ${data.name}, ${shortDate(data.date)}`);
  res.status(201).json(toEvent((await findEventById(id))!));
};

export const replaceEvent = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  const data = { status: current.status, ...req.body };
  const quota = parseQuota(data.quota);
  const errors: FieldErrors = {};
  if (await eventNameTaken(data.name, data.date, current.id)) errors.name = 'Acara dengan nama yang sama sudah ada di tanggal ini.';
  if (quota !== null && current.sold && quota < current.sold) errors.quota = `Kuota tidak boleh kurang dari tiket terjual (${current.sold}).`;
  assertValid(errors);

  await updateEvent(current.id, {
    name: data.name,
    short: data.name === current.name ? current.short : data.name,
    organizer: data.organizer,
    date: data.date,
    start: data.start,
    end: data.end,
    venue: data.venue,
    status: data.status,
    quota,
    sold: quota !== null ? (current.sold ?? 0) : null,
    price: quota !== null ? priceOr(data.price, current.price ?? DEFAULT_PRICE) : null,
  });
  if (data.category !== undefined) await setEventCategory(current.id, data.category);
  await logActivity('event', 'Agenda diperbarui', `${res.locals.user.name} · ${data.name}, ${shortDate(data.date)}`);
  res.json(toEvent((await findEventById(current.id))!));
};

/** Perubahan sebagian: status publikasi, kuota, atau harga tiket. */
export const patchEvent = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  const body = req.body ?? {};
  const errors: FieldErrors = {};
  const next = { status: current.status as string, quota: current.quota, price: current.price };
  if (body.status !== undefined) {
    if (!EVENT_STATUSES.includes(body.status)) errors.status = 'Status publikasi tidak dikenal.';
    else next.status = body.status;
  }
  if (body.quota !== undefined) {
    const quota = parseQuota(body.quota);
    if (quota !== null && (!Number.isInteger(quota) || quota < 1)) errors.quota = 'Kuota harus bilangan bulat minimal 1.';
    else if (quota !== null && quota < (current.sold ?? 0)) errors.quota = `Kuota tidak boleh kurang dari tiket terjual (${current.sold}).`;
    else next.quota = quota;
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isInteger(price) || price < 0) errors.price = 'Harga tidak boleh negatif.';
    else next.price = price;
  }
  assertValid(errors);

  const hasTickets = next.quota !== null;
  await updateEventInventory(current.id, {
    status: next.status,
    quota: next.quota,
    sold: hasTickets ? (current.sold ?? 0) : null,
    price: hasTickets ? (next.price ?? DEFAULT_PRICE) : null,
  });
  const by = res.locals.user.name;
  if (next.status !== current.status)
    await logActivity('event', next.status === 'Terpublikasi' ? 'Acara diterbitkan' : 'Publikasi acara ditarik', `${by} · ${current.name}`);
  else await logActivity('event', 'Inventori tiket diperbarui', `${by} · ${current.name}, kuota ${next.quota ?? '—'}`);
  res.json(toEvent((await findEventById(current.id))!));
};

export const removeEvent = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  const n = await countOrdersForEvent(current.id);
  if (n) throw conflict(`Acara memiliki ${n} pesanan tiket sehingga tidak dapat dihapus. Tarik publikasinya saja.`);
  await deleteEvent(current.id);
  if (current.image) await removeStoredImage(current.image);
  await logActivity('event', 'Acara dihapus', `${res.locals.user.name} · ${current.name}`);
  res.status(204).end();
};

/** Format gambar acara yang diterima (dicek juga isi berkasnya, bukan hanya Content-Type). */
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_ERROR = 'Gambar harus berformat JPG, PNG, atau WEBP.';

/** Berkas lama gagal dihapus tidak boleh menggagalkan permintaan (data acara sudah benar). */
const removeStoredImage = (key: string) => storageService.deleteFile(key).catch(() => undefined);

/**
 * Unggah/ganti gambar acara: POST /api/events/:id/image, isi permintaan = berkas mentah
 * (Content-Type image/jpeg|png|webp, maks. 5 MB), dibaca express.raw() di routes/api.ts.
 * Disimpan di Vercel Blob folder "acara" atau folder uploads/; gambar lama dihapus.
 */
export const uploadEventImage = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  const mime = String(req.get('content-type') ?? '').split(';')[0].toLowerCase();
  if (!IMAGE_TYPES.includes(mime) || !Buffer.isBuffer(req.body)) throw new HttpError(415, IMAGE_ERROR);
  if (!req.body.length) throw badRequest('Pilih berkas gambar.', { gambar: 'Pilih berkas gambar.' });
  if (req.body.length > MAX_FILE_SIZE) throw badRequest('Ukuran gambar maksimal 5 MB.', { gambar: 'Maksimal 5 MB.' });
  if (!matchesSignature(mime, req.body)) throw badRequest(IMAGE_ERROR, { gambar: 'Isi berkas bukan gambar yang valid.' });

  const stored = await storageService.uploadFile(req.body, queryText(req.query.name) || `acara-${current.id}`, mime, 'acara');
  try {
    await setEventImage(current.id, stored.fileKey);
  } catch (error) {
    // Rollback anti-file yatim: berkas baru dihapus bila data gagal disimpan.
    await removeStoredImage(stored.fileKey);
    throw error;
  }
  if (current.image) await removeStoredImage(current.image);
  await logActivity('event', 'Gambar acara diperbarui', `${res.locals.user.name} · ${current.name}`);
  res.json(toEvent((await findEventById(current.id))!));
};

/** Hapus gambar unggahan: acara kembali memakai foto bawaan/foto lokasi. */
export const removeEventImage = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  if (current.image) {
    await setEventImage(current.id, null);
    await removeStoredImage(current.image);
    await logActivity('event', 'Gambar acara dihapus', `${res.locals.user.name} · ${current.name}`);
  }
  res.json(toEvent((await findEventById(current.id))!));
};

/** Pulihkan data contoh acara. */
export const resetEvents = async (_req: Request, res: Response) => {
  const images = await sampleResetImages();
  await resetSampleEvents();
  await Promise.all(images.map(removeStoredImage));
  await logActivity('system', 'Data contoh acara dipulihkan', res.locals.user.name);
  res.json((await listEvents()).map(toEvent));
};
