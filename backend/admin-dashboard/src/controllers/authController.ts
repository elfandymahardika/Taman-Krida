import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logActivity, notify } from '../lib/activity';
import { iso } from '../lib/format';
import { assertValid, FieldErrors, HttpError } from '../lib/http';
import { hashPassword, needsRehash, verifyPassword } from '../lib/password';
import { accessOf, roleLabel } from '../lib/roles';
import { maxAttempts, sessionMinutes } from '../lib/settings';
import { inactiveReason } from '../middleware/authMiddleware';
import { loginLockout } from '../middleware/rateLimiter';
import { getSettings } from '../models/kvModel';
import { createSession, findSessionById, revokeSession } from '../models/sessionModel';
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  touchLastSeen,
  updateUserPassword,
  User,
} from '../models/userModel';


export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** Profil + hak akses pengguna yang dikirim ke frontend (tanpa hash password). */
export const publicUser = (u: User) => ({
  id: u.id,
  username: u.username,
  name: u.name,
  email: u.email,
  role: roleLabel(u.role_key),
  roleKey: u.role_key,
  initials: u.initials,
  /** Tingkat akses per modul ('y' ubah, 'p' lihat, 'n' tanpa akses) untuk membatasi menu & halaman di UI. */
  access: accessOf(u.role_key),
});

/**
 * Token login (JWT) + baris sesi di database. `jti` di token menunjuk ke sesi, sehingga logout
 * dapat mencabut token walaupun belum kedaluwarsa. Masa berlaku mengikuti Pengaturan → Keamanan → Durasi sesi.
 */
async function signToken(user: User, userAgent?: string) {
  const minutes = sessionMinutes(await getSettings());
  const jti = randomUUID();
  await createSession({
    id: jti,
    userId: user.id,
    expiresAt: new Date(Date.now() + minutes * 60_000),
    userAgent: userAgent?.slice(0, 200) ?? null,
  });
  const expiresIn = `${minutes}m`;
  const token = jwt.sign({ sub: String(user.id), role: user.role_key }, config.jwtSecret, {
    expiresIn: minutes * 60,
    jwtid: jti,
  });
  return { token, expiresIn };
}

/**
 * Registrasi staf baru (password dienkripsi dengan bcrypt) → status "Menunggu persetujuan", belum bisa login.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, username, email, password } = req.body;

  // Cek apakah username / email sudah terdaftar
  const errors: FieldErrors = {};
  if (await findUserByUsername(username)) errors.username = 'Username ini sudah dipakai.';
  if (await findUserByEmail(email)) errors.email = 'Email ini sudah terdaftar.';
  assertValid(errors);

  // Enkripsi password menggunakan bcrypt (salt rounds = 10). Password asli tidak pernah disimpan.
  const passwordHash = await hashPassword(password);

  // Simpan ke database via userModel (Prisma Client)
  const id = await createUser({
    username,
    passwordHash,
    name,
    email,
    roleKey: null,
    initials: initialsOf(name),
    status: 'Menunggu persetujuan',
  });
  await logActivity('user', 'Pendaftaran staf baru', `${name} (${username}) · menunggu persetujuan`);
  await notify(`${name} mendaftar sebagai staf — menunggu persetujuan`, '/pengguna');

  const user = (await findUserById(id))!;
  res.status(201).json({
    message: 'Pendaftaran berhasil. Akun dapat dipakai setelah disetujui Administrator utama.',
    user: { ...publicUser(user), status: user.status },
  });
};

/**
 * Login (cocokkan password dengan bcrypt & terbitkan JWT token)
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  // Akun terkunci sementara setelah beberapa kali gagal (lihat middleware/rateLimiter.ts).
  loginLockout.assertOpen(username);

  // Cari user di database, lalu bandingkan password input dengan hash bcrypt.
  // Pesan sama untuk username tidak ada maupun password salah (tidak membocorkan akun yang terdaftar).
  const user = await findUserByUsername(username);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    loginLockout.fail(username, maxAttempts(await getSettings()));
    throw new HttpError(401, 'Username atau password salah.');
  }
  loginLockout.reset(username);

  // Kredensial benar, tetapi akun belum/tidak boleh masuk (menunggu persetujuan, ditolak, nonaktif).
  const reason = inactiveReason(user);
  if (reason) throw new HttpError(403, reason);

  // Hash lama (scrypt) otomatis diganti ke bcrypt saat login berhasil.
  if (needsRehash(user.password_hash)) await updateUserPassword(user.id, await hashPassword(password));

  await touchLastSeen(user.id);
  const { token, expiresIn } = await signToken(user, req.get('user-agent'));
  res.json({ token, expiresIn, user: publicUser(user) });
};

/** Logout: mencabut sesi token yang sedang dipakai. */
export const logout = async (req: Request, res: Response): Promise<void> => {
  await revokeSession(req.user!.sessionId);
  res.status(204).end();
};

/** Profil + hak akses pengguna yang sedang login, beserta waktu sesi (masuk & kedaluwarsa). */
export const me = async (req: Request, res: Response) => {
  const session = await findSessionById(req.user!.sessionId);
  res.json({
    user: publicUser(res.locals.user),
    session: { createdAt: iso(session!.created_at), expiresAt: iso(session!.expires_at) },
  });
};
