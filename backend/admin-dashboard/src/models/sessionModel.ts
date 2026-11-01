import type { Session as PrismaSession } from '@prisma/client';
import prisma from '../lib/prisma';
import { sqlTime } from './userModel';

/** Sesi login staf (tabel sessions) lewat Prisma Client. Waktu dalam format DATETIME UTC seperti sebelumnya. */
export interface Session {
  id: string;
  user_id: number;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  user_agent: string | null;
}

const toSession = (s: PrismaSession): Session => ({
  id: s.id,
  user_id: Number(s.user_id),
  created_at: sqlTime(s.created_at),
  expires_at: sqlTime(s.expires_at),
  revoked_at: s.revoked_at ? sqlTime(s.revoked_at) : null,
  user_agent: s.user_agent,
});

/** Simpan sesi login baru. Sesi yang sudah kedaluwarsa dibersihkan sekalian. */
export const createSession = async (session: { id: string; userId: number; expiresAt: Date; userAgent: string | null }) => {
  const now = new Date();
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { expires_at: { lt: now } } }),
    prisma.session.create({
      data: {
        id: session.id,
        user_id: BigInt(session.userId),
        created_at: now,
        expires_at: session.expiresAt,
        user_agent: session.userAgent,
      },
    }),
  ]);
};

export const findSessionById = async (id: string): Promise<Session | null> => {
  const session = await prisma.session.findUnique({ where: { id } });
  return session ? toSession(session) : null;
};

/** Cabut satu sesi (logout). */
export const revokeSession = async (id: string) => {
  await prisma.session.updateMany({ where: { id, revoked_at: null }, data: { revoked_at: new Date() } });
};

/** Cabut semua sesi milik pengguna (mis. akun dinonaktifkan). */
export const revokeUserSessions = async (userId: number) => {
  await prisma.session.updateMany({ where: { user_id: BigInt(userId), revoked_at: null }, data: { revoked_at: new Date() } });
};
