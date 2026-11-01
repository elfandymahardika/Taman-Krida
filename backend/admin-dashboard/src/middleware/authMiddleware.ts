import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { HttpError } from '../lib/http';
import { findSessionById } from '../models/sessionModel';
import { findUserById, touchLastSeen, User } from '../models/userModel';

export interface JwtPayload {
  /** ID pengguna (string, standar klaim JWT). */
  sub: string;
  role: string | null;
  /** ID sesi di tabel sessions. */
  jti: string;
}

/** Pesan untuk akun yang tidak boleh masuk, atau null bila aktif. */
export const inactiveReason = (u: User) =>
  ({
    Aktif: null,
    Nonaktif: 'Akun dinonaktifkan. Hubungi Administrator utama.',
    Undangan: 'Akun belum diaktifkan. Selesaikan undangan aktivasi terlebih dahulu.',
    'Menunggu persetujuan': 'Akun Anda masih menunggu persetujuan Administrator utama.',
    Ditolak: 'Pendaftaran akun ini ditolak. Hubungi Administrator utama.',
  })[u.status] ?? null;

const SEEN_EVERY_MS = 60_000;

/**
 * Middleware wajib login: mengekstrak token JWT dari header `Authorization: Bearer <token>`,
 * memastikan sesinya belum dicabut (logout), lalu menyimpan ID pengguna ke res.locals.userId.
 * Data pengguna (peran & status) dibaca ulang dari database setiap permintaan → res.locals.user.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new HttpError(401, 'Silakan login terlebih dahulu.'));

  // Format header Bearer: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return next(new HttpError(401, 'Format token salah. Gunakan format "Bearer <token>".'));
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(parts[1], config.jwtSecret) as JwtPayload;
  } catch {
    return next(new HttpError(401, 'Sesi berakhir. Silakan login kembali.'));
  }

  const session = payload.jti ? await findSessionById(payload.jti) : null;
  if (!session || session.revoked_at || String(session.user_id) !== payload.sub) {
    return next(new HttpError(401, 'Sesi sudah tidak berlaku. Silakan login kembali.'));
  }

  const user = await findUserById(Number(payload.sub));
  if (!user) return next(new HttpError(401, 'Akun tidak ditemukan. Silakan login kembali.'));

  // Akun yang dinonaktifkan langsung kehilangan akses, walau tokennya belum kedaluwarsa.
  const reason = inactiveReason(user);
  if (reason) return next(new HttpError(401, reason));

  const lastSeen = user.last_seen_at ? Date.parse(`${user.last_seen_at.replace(' ', 'T')}Z`) : 0;
  if (Date.now() - lastSeen > SEEN_EVERY_MS) await touchLastSeen(user.id);

  // Pengguna terverifikasi dipasang di req.user (dibaca requireRole & controller auth).
  req.user = { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role_key, sessionId: session.id };
  // Simpan juga ID pengguna ke dalam res.locals.userId sesuai standar Modul 01
  res.locals.userId = user.id;
  res.locals.user = user;
  res.locals.sessionId = session.id;
  next();
};
