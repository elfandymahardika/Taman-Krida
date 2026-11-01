import { Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import { iso } from '../lib/format';
import { assertValid, conflict, FieldErrors, notFound } from '../lib/http';
import { isRoleKey, MATRIX, MODULES, roleLabel, ROLES } from '../lib/roles';
import { EMAIL_RE } from '../lib/validate';
import { revokeUserSessions } from '../models/sessionModel';
import {
  countUsersByRole,
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  listUsers,
  updateUserRoleStatus,
  User,
} from '../models/userModel';
import { initialsOf } from './authController';

const PENDING = 'Menunggu persetujuan';

const toStaff = (u: User) => ({
  id: u.id,
  username: u.username,
  name: u.name,
  email: u.email,
  role: roleLabel(u.role_key),
  roleKey: u.role_key,
  initials: u.initials,
  status: u.status,
  lastSeenAt: iso(u.last_seen_at),
  createdAt: iso(u.created_at),
});

/** Peran yang boleh diberikan dari halaman Pengguna (Administrator utama tidak bisa dibuat dari sini). */
const isOperationalRole = (key: unknown) => isRoleKey(key) && key !== 'admin';

/** Staf admin = akun login panel. Mengubah peran langsung mengubah hak akses di backend. */
export const getUsers = async (_req: Request, res: Response) => {
  res.json((await listUsers()).map(toStaff));
};

/** Peran, modul, dan matriks hak akses yang dipakai backend. */
export const getRoles = async (_req: Request, res: Response) => {
  const counts = await countUsersByRole();
  res.json({ roles: ROLES.map((r) => ({ ...r, staff: counts[r.key] ?? 0 })), modules: MODULES, matrix: MATRIX });
};

/** Undang staf: akun dibuat berstatus "Undangan" tanpa password sampai staf menyelesaikan aktivasi. */
export const inviteUser = async (req: Request, res: Response) => {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const roleKey = req.body?.roleKey;
  const errors: FieldErrors = {};
  if (name.length < 3) errors.nama = 'Nama minimal 3 karakter.';
  if (!EMAIL_RE.test(email)) errors.email = 'Format email tidak valid.';
  else if (await findUserByEmail(email)) errors.email = 'Email ini sudah terdaftar.';
  if (!isOperationalRole(roleKey)) errors.peran = 'Pilih peran operasional.';
  assertValid(errors);

  // Username dari bagian depan email; ditambah angka bila sudah dipakai.
  const base = email.split('@')[0].replace(/[^a-z0-9._]/g, '').slice(0, 30) || 'staf';
  let username = base;
  for (let i = 2; await findUserByUsername(username); i++) username = `${base}${i}`;

  // Hash "!" tidak pernah cocok dengan password apa pun.
  const id = await createUser({ username, passwordHash: '!', name, email, roleKey, initials: initialsOf(name), status: 'Undangan' });
  await logActivity('user', 'Staf admin diundang', `${res.locals.user.name} · ${name}, ${roleLabel(roleKey)}`);
  res.status(201).json(toStaff((await findUserById(id))!));
};

/** Akun lain yang boleh diubah: bukan diri sendiri dan bukan Administrator utama. */
async function editable(req: Request, res: Response) {
  const target = await findUserById(Number(req.params.id));
  if (!target) throw notFound('Staf');
  if (target.id === res.locals.userId) throw conflict('Anda tidak dapat mengubah peran atau status akun sendiri.');
  if (target.role_key === 'admin') throw conflict('Akun Administrator utama dilindungi dan tidak dapat diubah dari sini.');
  return target;
}

/** Setujui pendaftaran: pilih peran operasional, akun langsung bisa login. */
export const approveUser = async (req: Request, res: Response) => {
  const target = await editable(req, res);
  if (target.status !== PENDING) throw conflict('Akun ini tidak sedang menunggu persetujuan.');
  const roleKey = req.body?.roleKey;
  if (!isOperationalRole(roleKey)) assertValid({ roleKey: 'Pilih peran operasional untuk akun ini.' });
  await updateUserRoleStatus(target.id, roleKey, 'Aktif');
  await logActivity('user', 'Pendaftaran staf disetujui', `${res.locals.user.name} · ${target.name} sebagai ${roleLabel(roleKey)}`);
  res.json(toStaff((await findUserById(target.id))!));
};

/** Tolak pendaftaran: akun tetap tercatat (untuk riwayat) tetapi tidak bisa login. */
export const rejectUser = async (req: Request, res: Response) => {
  const target = await editable(req, res);
  if (target.status !== PENDING) throw conflict('Akun ini tidak sedang menunggu persetujuan.');
  await updateUserRoleStatus(target.id, target.role_key, 'Ditolak');
  await logActivity('user', 'Pendaftaran staf ditolak', `${res.locals.user.name} · ${target.name}`);
  res.json(toStaff((await findUserById(target.id))!));
};

/** Ubah peran dan/atau status (Aktif/Nonaktif) staf. */
export const updateUser = async (req: Request, res: Response) => {
  const target = await editable(req, res);
  if (target.status === PENDING || target.status === 'Ditolak') throw conflict('Akun hasil pendaftaran diproses lewat Setujui atau Tolak.');

  const { roleKey, status } = req.body ?? {};
  const errors: FieldErrors = {};
  if (roleKey !== undefined && !isOperationalRole(roleKey)) errors.roleKey = 'Pilih peran operasional.';
  if (status !== undefined) {
    if (!['Aktif', 'Nonaktif'].includes(status)) errors.status = 'Status harus Aktif atau Nonaktif.';
    else if (status === 'Aktif' && target.status === 'Undangan') errors.status = 'Akun undangan aktif setelah staf menyelesaikan aktivasi.';
  }
  assertValid(errors);

  const next = { roleKey: roleKey ?? target.role_key, status: status ?? target.status };
  await updateUserRoleStatus(target.id, next.roleKey, next.status);
  // Akun nonaktif: semua sesi login-nya dicabut sehingga token lama langsung ditolak.
  if (next.status === 'Nonaktif') await revokeUserSessions(target.id);
  const by = res.locals.user.name;
  if (next.roleKey !== target.role_key)
    await logActivity('user', 'Peran admin diperbarui', `${by} · ${target.name}: ${roleLabel(target.role_key)} → ${roleLabel(next.roleKey)}`);
  if (next.status !== target.status)
    await logActivity('user', next.status === 'Aktif' ? 'Akun staf diaktifkan' : 'Akun staf dinonaktifkan', `${by} · ${target.name}`);
  res.json(toStaff((await findUserById(target.id))!));
};
