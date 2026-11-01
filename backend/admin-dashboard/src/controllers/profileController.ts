import { Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import { assertValid, FieldErrors, notFound } from '../lib/http';
import {
  createFacility,
  Facility,
  facilityNameTaken,
  findFacilityById,
  listFacilities,
  toFacility,
  updateFacility,
} from '../models/facilityModel';
import { readKv, writeKv } from '../models/kvModel';
import { slug } from './communityController';

const str = (v: unknown) => String(v ?? '').trim();

async function profilePayload() {
  const kv = await readKv('profile');
  return { profile: kv?.value, updatedAt: kv?.updatedAt, updatedBy: kv?.updatedBy };
}

/** Profil lembaga yang tampil di aplikasi publik. */
export const getProfile = async (_req: Request, res: Response) => {
  res.json(await profilePayload());
};

/** Data sudah divalidasi validateProfile → req.body.profile. */
export const saveProfile = async (req: Request, res: Response) => {
  await writeKv('profile', req.body.profile, res.locals.user.name);
  await logActivity('content', 'Profil TKBJ diperbarui', `${res.locals.user.name} · tampil di aplikasi publik`);
  res.json(await profilePayload());
};

/** Validasi area. Nama area yang dipakai acara & sewa dikunci agar data lama tetap cocok. */
async function validateFacility(body: Record<string, any>, current?: Facility) {
  const f = {
    name: str(body.name),
    capacity: body.capacity === '' || body.capacity == null ? null : Number(body.capacity),
    purpose: str(body.purpose),
    note: str(body.note) || null,
  };
  const errors: FieldErrors = {};
  if (current?.bookable && f.name !== current.name) errors.name = 'Nama fasilitas yang dipakai acara & sewa tidak dapat diubah.';
  else if (f.name.length < 3) errors.name = 'Nama area minimal 3 karakter.';
  else if (await facilityNameTaken(f.name, current?.id)) errors.name = 'Area dengan nama ini sudah ada.';
  if (f.capacity !== null && (!Number.isInteger(f.capacity) || f.capacity < 0)) errors.capacity = 'Kapasitas harus bilangan bulat ≥ 0.';
  if (!f.purpose) errors.purpose = 'Fungsi utama wajib diisi.';
  assertValid(errors);
  return f;
}

export const getFacilities = async (_req: Request, res: Response) => {
  res.json((await listFacilities()).map(toFacility));
};

export const addFacility = async (req: Request, res: Response) => {
  const f = await validateFacility(req.body ?? {});
  let id = slug(f.name, 'area');
  while (await findFacilityById(id)) id = `${slug(f.name, 'area')}-${Math.random().toString(36).slice(2, 6)}`;
  await createFacility({ id, ...f });
  await logActivity('content', 'Area baru ditambahkan', `${res.locals.user.name} · ${f.name}`);
  res.status(201).json(toFacility((await findFacilityById(id))!));
};

export const editFacility = async (req: Request<{ id: string }>, res: Response) => {
  const current = await findFacilityById(req.params.id);
  if (!current) throw notFound('Area');
  const f = await validateFacility(req.body ?? {}, current);
  await updateFacility(current.id, f);
  await logActivity('content', 'Data area diperbarui', `${res.locals.user.name} · ${f.name}`);
  res.json(toFacility((await findFacilityById(current.id))!));
};
