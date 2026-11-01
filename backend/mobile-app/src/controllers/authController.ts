import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { iso } from '../lib/format';
import { assertValid, HttpError, isDuplicate } from '../lib/http';
import { hashPassword, verifyPassword } from '../lib/password';
import { syncStatusNotifications } from '../lib/status';
import { loginLockout } from '../middleware/rateLimiter';
import { insertNotification } from '../models/notificationModel';
import { createSession, findSessionById, revokeOtherSessions, revokeSession } from '../models/sessionModel';
import {
  createVisitor,
  findVisitorByEmail,
  findVisitorById,
  toVisitor,
  updateVisitorPassword,
  updateVisitorProfile,
  Visitor,
  visitorStats,
} from '../models/visitorModel';

/** Akun dikunci 15 menit setelah 5 kali kata sandi salah (middleware/rateLimiter.ts). */
const MAX_ATTEMPTS = 5;

/**
 * Token login (JWT) + baris sesi di database. `jti` di token menunjuk ke sesi, sehingga logout
 * dapat mencabut token walaupun belum kedaluwarsa. `aud` membedakan token pengunjung dari token staf.
 */
async function signToken(visitor: Visitor, userAgent?: string) {
  const jti = randomUUID();
  const seconds = config.sessionDays * 86400;
  await createSession({
    id: jti,
    visitorId: visitor.id,
    expiresAt: new Date(Date.now() + seconds * 1000),
    userAgent: userAgent?.slice(0, 200) ?? null,
  });
  const token = jwt.sign({ sub: String(visitor.id) }, config.jwtSecret, { expiresIn: seconds, jwtid: jti, audience: config.jwtAudience });
  return { token, expiresIn: `${config.sessionDays}d` };
}

/**
 * Registrasi pengunjung (password dienkripsi bcrypt). Akun langsung aktif dan langsung masuk (token dikirim).
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, city, password } = req.body;
  if (await findVisitorByEmail(email)) assertValid({ email: 'Email ini sudah terdaftar. Silakan masuk.' });

  let id: number;
  try {
    id = await createVisitor({ name, email, phone, city, passwordHash: await hashPassword(password) });
  } catch (error) {
    // Dua pendaftaran bersamaan dengan email sama: indeks UNIQUE yang memutuskan.
    if (isDuplicate(error)) assertValid({ email: 'Email ini sudah terdaftar. Silakan masuk.' });
    throw error;
  }
  const visitor = (await findVisitorById(id))!;
  await insertNotification(id, {
    symbol: '📅',
    title: 'Selamat datang di TKBJ',
    body: 'Jelajahi kalender acara, pesan tiket pertunjukan, dan ajukan sewa gedung langsung dari aplikasi.',
    target: 'calendar',
  });
  res.status(201).json({ ...(await signToken(visitor, req.get('user-agent'))), user: toVisitor(visitor) });
};

/**
 * Login (cocokkan password dengan bcrypt & terbitkan JWT token)
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  loginLockout.assertOpen(email);

  // Pesan sama untuk email tidak ada maupun password salah (tidak membocorkan akun yang terdaftar).
  const visitor = await findVisitorByEmail(email);
  if (!visitor || !(await verifyPassword(password, visitor.password_hash))) {
    loginLockout.fail(email, MAX_ATTEMPTS);
    throw new HttpError(401, 'Email atau kata sandi salah.');
  }
  loginLockout.reset(email);

  res.json({ ...(await signToken(visitor, req.get('user-agent'))), user: toVisitor(visitor) });
};

/** Logout: mencabut sesi token yang sedang dipakai. */
export const logout = async (req: Request, res: Response): Promise<void> => {
  await revokeSession(req.user!.sessionId);
  res.status(204).end();
};

/** Profil pengunjung + ringkasan halaman Akun Saya. Status pesanan/sewa dari admin disinkronkan dulu. */
export const me = async (req: Request, res: Response) => {
  await syncStatusNotifications(res.locals.userId);
  const session = await findSessionById(req.user!.sessionId);
  res.json({
    user: toVisitor(res.locals.visitor),
    stats: await visitorStats(res.locals.userId),
    session: { createdAt: iso(session!.created_at), expiresAt: iso(session!.expires_at) },
  });
};

/** Edit profil (nama, email, telepon, kota). */
export const updateProfile = async (req: Request, res: Response) => {
  const { name, email, phone, city } = req.body;
  const owner = await findVisitorByEmail(email);
  if (owner && owner.id !== res.locals.userId) assertValid({ email: 'Email ini sudah dipakai akun lain.' });
  try {
    await updateVisitorProfile(res.locals.userId, { name, email, phone, city });
  } catch (error) {
    if (isDuplicate(error)) assertValid({ email: 'Email ini sudah dipakai akun lain.' });
    throw error;
  }
  res.json({ user: toVisitor((await findVisitorById(res.locals.userId))!) });
};

/** Ganti kata sandi. Sesi di perangkat lain dicabut; sesi yang sedang dipakai tetap berlaku. */
export const changePassword = async (req: Request, res: Response) => {
  const { current, password } = req.body;
  if (!(await verifyPassword(current, res.locals.visitor.password_hash))) assertValid({ current: 'Kata sandi saat ini salah.' });
  await updateVisitorPassword(res.locals.userId, await hashPassword(password));
  await revokeOtherSessions(res.locals.userId, res.locals.sessionId);
  res.json({ message: 'Kata sandi berhasil diubah. Perangkat lain telah dikeluarkan.' });
};
