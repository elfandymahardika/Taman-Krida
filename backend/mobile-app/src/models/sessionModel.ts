import type { VisitorSession } from '@prisma/client';
import prisma from '../lib/prisma';
import { sqlTime } from './visitorModel';

/** Sesi login pengunjung (tabel visitor_sessions) lewat Prisma Client. */
export interface Session {
  id: string;
  visitor_id: number;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  user_agent: string | null;
}

const toSession = (s: VisitorSession): Session => ({
  id: s.id,
  visitor_id: Number(s.visitor_id),
  created_at: sqlTime(s.created_at),
  expires_at: sqlTime(s.expires_at),
  revoked_at: s.revoked_at ? sqlTime(s.revoked_at) : null,
  user_agent: s.user_agent,
});

/** Simpan sesi login baru. Sesi yang sudah kedaluwarsa dibersihkan sekalian. */
export const createSession = async (session: { id: string; visitorId: number; expiresAt: Date; userAgent: string | null }) => {
  const now = new Date();
  await prisma.$transaction([
    prisma.visitorSession.deleteMany({ where: { expires_at: { lt: now } } }),
    prisma.visitorSession.create({
      data: { id: session.id, visitor_id: BigInt(session.visitorId), created_at: now, expires_at: session.expiresAt, user_agent: session.userAgent },
    }),
  ]);
};

export const findSessionById = async (id: string): Promise<Session | null> => {
  const session = await prisma.visitorSession.findUnique({ where: { id } });
  return session ? toSession(session) : null;
};

/** Cabut satu sesi (logout). */
export const revokeSession = async (id: string) => {
  await prisma.visitorSession.updateMany({ where: { id, revoked_at: null }, data: { revoked_at: new Date() } });
};

/** Cabut semua sesi lain milik pengunjung (mis. setelah ganti kata sandi). */
export const revokeOtherSessions = async (visitorId: number, keepId: string) => {
  await prisma.visitorSession.updateMany({
    where: { visitor_id: BigInt(visitorId), id: { not: keepId }, revoked_at: null },
    data: { revoked_at: new Date() },
  });
};
