import { Request, Response } from 'express';
import { logActivity, notify } from '../lib/activity';
import { assertValid, conflict, FieldErrors, notFound } from '../lib/http';
import {
  Community,
  communityNameTaken,
  createCommunity,
  findCommunityById,
  listCommunities,
  toCommunity,
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
