import { Request, Response } from 'express';
import { logActivity, notify } from '../lib/activity';
import { assertValid, conflict, FieldErrors, notFound } from '../lib/http';
import { PHONE_RE } from '../lib/validate';
import {
  Community,
  communityNameTaken,
  createCommunity,
  findCommunityById,
  listCommunities,
  toCommunity,
  updateCommunityProfile,
  updateCommunityStatus,
} from '../models/communityModel';

export const CATEGORIES = ['Seni tari tradisional', 'Seni pertunjukan', 'Seni musik', 'Seni kriya'];

export const slug = (s: string, fallback: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || fallback;

async function mustFind(id: string) {
  const c = await findCommunityById(id);
  if (!c) throw notFound('Komunitas');
  return c;
}

const mustBePending = (c: Community) => {
  if (c.status !== 'Menunggu persetujuan') throw conflict('Pendaftaran ini sudah diputuskan.');
};

export const getCommunities = async (_req: Request, res: Response) => {
  res.json((await listCommunities()).map(toCommunity));
};

export const addCommunity = async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const name = String(body.name ?? '').trim();
  const contact = String(body.contact ?? '').trim();
  const errors: FieldErrors = {};
  if (name.length < 3) errors.nama = 'Nama komunitas minimal 3 karakter.';
  else if (await communityNameTaken(name)) errors.nama = 'Komunitas dengan nama ini sudah terdaftar.';
  if (!CATEGORIES.includes(body.category)) errors.kategori = 'Pilih kategori yang tersedia.';
  if (contact && !/^[0-9+\-\s]{9,16}$/.test(contact)) errors.wa = 'Nomor WhatsApp tidak valid.';
  assertValid(errors);

  let id = slug(name, 'komunitas');
  while (await findCommunityById(id)) id = `${slug(name, 'komunitas')}-${Math.random().toString(36).slice(2, 6)}`;
  await createCommunity({
    id,
    name,
    category: body.category,
    city: String(body.city ?? '').trim() || 'Jawa Timur',
    members: Number(body.members) || 0,
    contact: contact || '—',
    note: String(body.note ?? '').trim() || null,
  });
  await logActivity('community', 'Komunitas ditambahkan ke direktori', `${res.locals.user.name} · ${name}`);
  res.status(201).json(toCommunity((await findCommunityById(id))!));
};

/** Jadwal latihan: maks. 7 baris "hari | jam". */
const MAX_SCHEDULE = 7;

/**
 * Edit data komunitas yang tampil di Direktori Komunitas aplikasi: identitas, kontak, profil, jadwal latihan,
 * dan jumlah pentas. Pesan error memakai nama kolom formulir dashboard.
 */
export const editCommunity = async (req: Request<{ id: string }>, res: Response) => {
  const current = await mustFind(req.params.id);
  const b = req.body ?? {};
  const t = (v: unknown) => String(v ?? '').trim();
  const opt = (v: unknown) => t(v) || null;
  const data = {
    name: t(b.name),
    category: t(b.category),
    city: t(b.city),
    members: Number(t(b.members) || 0),
    contact: t(b.contact) || '—',
    leader: opt(b.leader),
    since: opt(b.since),
    description: opt(b.description),
    address: opt(b.address),
    schedule:
      t(b.schedule)
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join('\n') || null,
    performances: opt(b.performances),
  };
  const errors: FieldErrors = {};
  if (data.name.length < 3 || data.name.length > 100) errors.name = 'Nama komunitas 3–100 karakter.';
  else if (await communityNameTaken(data.name, current.id)) errors.name = 'Komunitas dengan nama ini sudah terdaftar.';
  if (!CATEGORIES.includes(data.category)) errors.category = 'Pilih kategori yang tersedia.';
  if (!data.city || data.city.length > 60) errors.city = 'Kota wajib diisi (maks. 60 karakter).';
  if (!Number.isInteger(data.members) || data.members < 0 || data.members > 100000) errors.members = 'Jumlah anggota harus bilangan bulat ≥ 0.';
  if (data.contact !== '—' && !PHONE_RE.test(data.contact)) errors.contact = 'Nomor telepon/WhatsApp tidak valid.';
  if ((data.leader?.length ?? 0) > 100) errors.leader = 'Nama ketua maksimal 100 karakter.';
  if ((data.since?.length ?? 0) > 40) errors.since = 'Maksimal 40 karakter.';
  if ((data.description?.length ?? 0) > 500) errors.description = 'Deskripsi maksimal 500 karakter.';
  if ((data.address?.length ?? 0) > 200) errors.address = 'Alamat maksimal 200 karakter.';
  if ((data.performances?.length ?? 0) > 40) errors.performances = 'Maksimal 40 karakter.';
  const lines = data.schedule?.split('\n') ?? [];
  if (lines.length > MAX_SCHEDULE) errors.schedule = `Jadwal maksimal ${MAX_SCHEDULE} baris.`;
  else if ((data.schedule?.length ?? 0) > 300) errors.schedule = 'Jadwal maksimal 300 karakter.';
  else {
    const bad = lines.findIndex((l) => l.split('|').length !== 2 || l.split('|').some((p) => !p.trim()));
    if (bad >= 0) errors.schedule = `Baris ${bad + 1}: gunakan format "hari | jam", mis. "Sabtu | 15.00–17.00".`;
  }
  assertValid(errors);

  await updateCommunityProfile(current.id, data);
  await logActivity('community', 'Data komunitas diperbarui', `${res.locals.user.name} · ${data.name}`);
  res.json(toCommunity((await findCommunityById(current.id))!));
};

export const approveCommunity = async (req: Request<{ id: string }>, res: Response) => {
  const c = await mustFind(req.params.id);
  mustBePending(c);
  await updateCommunityStatus(c.id, 'Aktif', req.body?.note || null);
  await logActivity('community', 'Komunitas disetujui', `${res.locals.user.name} · ${c.name}`);
  await notify(`${c.name} kini tampil di direktori komunitas`, '/komunitas', 'community');
  res.json(toCommunity((await findCommunityById(c.id))!));
};

export const rejectCommunity = async (req: Request<{ id: string }>, res: Response) => {
  const c = await mustFind(req.params.id);
  mustBePending(c);
  await updateCommunityStatus(c.id, 'Ditolak', req.body?.note || null);
  await logActivity('community', 'Pendaftaran komunitas ditolak', `${res.locals.user.name} · ${c.name}`);
  res.json(toCommunity((await findCommunityById(c.id))!));
};

/** Aktifkan / nonaktifkan profil di direktori. */
export const setCommunityStatus = async (req: Request<{ id: string }>, res: Response) => {
  const c = await mustFind(req.params.id);
  const status = req.body?.status;
  if (!['Aktif', 'Nonaktif'].includes(status)) assertValid({ status: 'Status harus Aktif atau Nonaktif.' });
  if (!['Aktif', 'Nonaktif'].includes(c.status)) throw conflict('Komunitas belum disetujui.');
  await updateCommunityStatus(c.id, status);
  await logActivity(
    'community',
    status === 'Aktif' ? 'Profil komunitas diaktifkan' : 'Profil komunitas dinonaktifkan',
    `${res.locals.user.name} · ${c.name}`,
  );
  res.json(toCommunity((await findCommunityById(c.id))!));
};
