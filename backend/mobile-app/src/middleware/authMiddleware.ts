import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { HttpError } from '../lib/http';
import { findSessionById } from '../models/sessionModel';
import { findVisitorById } from '../models/visitorModel';

export interface JwtPayload {
  /** ID pengunjung (string, standar klaim JWT). */
  sub: string;
  /** ID sesi di tabel visitor_sessions. */
  jti: string;
}

/**
 * Middleware wajib login: mengekstrak token JWT dari header `Authorization: Bearer <token>`,
 * memastikan token memang token pengunjung (klaim `aud`) dan sesinya belum dicabut (logout),
 * lalu menyimpan ID pengunjung ke res.locals.userId sesuai standar modul.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new HttpError(401, 'Silakan masuk terlebih dahulu.'));

  // Format header Bearer: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return next(new HttpError(401, 'Format token salah. Gunakan format "Bearer <token>".'));
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(parts[1], config.jwtSecret, { audience: config.jwtAudience }) as JwtPayload;
  } catch {
    return next(new HttpError(401, 'Sesi berakhir. Silakan masuk kembali.'));
  }

  const session = payload.jti ? await findSessionById(payload.jti) : null;
  if (!session || session.revoked_at || String(session.visitor_id) !== payload.sub) {
    return next(new HttpError(401, 'Sesi sudah tidak berlaku. Silakan masuk kembali.'));
  }

  const visitor = await findVisitorById(Number(payload.sub));
  if (!visitor) return next(new HttpError(401, 'Akun tidak ditemukan. Silakan masuk kembali.'));

  // Pengunjung terverifikasi dipasang di req.user; res.locals tetap diisi untuk controller lain.
  req.user = { id: visitor.id, name: visitor.name, email: visitor.email, role: 'visitor', sessionId: session.id };
  res.locals.userId = visitor.id;
  res.locals.visitor = visitor;
  res.locals.sessionId = session.id;
  next();
};
