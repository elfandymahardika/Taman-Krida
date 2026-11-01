import type { User as PrismaUser, UserRole, UserStatus as PrismaUserStatus } from '@prisma/client';
import prisma, { fromDbEnum, toDbEnum } from '../lib/prisma';
import type { RoleKey } from '../lib/roles';

/*
 * Akun staf (tabel users) lewat Prisma Client. Bentuk data yang dikembalikan sama dengan versi SQL
 * murni sebelumnya (id number, enum seperti di database, waktu "YYYY-MM-DD HH:MM:SS.sss" UTC) agar
 * controller & middleware lain tidak berubah.
 */

export type UserStatus = 'Aktif' | 'Nonaktif' | 'Undangan' | 'Menunggu persetujuan' | 'Ditolak';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  name: string;
  email: string;
  role_key: RoleKey | null;
  initials: string;
  status: UserStatus;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Date → "2026-10-02 02:30:00.000" (format DATETIME yang dipakai helper `iso()`). */
export const sqlTime = (d: Date) => d.toISOString().replace('T', ' ').replace('Z', '');

const toUser = (u: PrismaUser): User => ({
  id: Number(u.id),
  username: u.username,
  password_hash: u.password_hash,
  name: u.name,
  email: u.email,
  role_key: u.role_key as RoleKey | null,
  initials: u.initials,
  status: toDbEnum(u.status) as UserStatus,
  last_seen_at: u.last_seen_at ? sqlTime(u.last_seen_at) : null,
  created_at: sqlTime(u.created_at),
  updated_at: sqlTime(u.updated_at),
});

const one = (u: PrismaUser | null) => (u ? toUser(u) : null);

/** Mencari user berdasarkan ID. */
export const findUserById = async (id: number) => one(await prisma.user.findUnique({ where: { id: BigInt(id) } }));

/** Mencari user berdasarkan username (dipakai saat login & registrasi). */
export const findUserByUsername = async (username: string) => one(await prisma.user.findUnique({ where: { username } }));

/** Mencari user berdasarkan email. */
export const findUserByEmail = async (email: string) => one(await prisma.user.findUnique({ where: { email } }));

/** Seluruh staf admin, urut sesuai waktu terdaftar. */
export const listUsers = async () => (await prisma.user.findMany({ orderBy: { id: 'asc' } })).map(toUser);

/** Jumlah staf per peran, mis. { admin: 1, acara: 2, ... } (kunci "null" = belum punya peran). */
export const countUsersByRole = async (): Promise<Record<string, number>> => {
  const groups = await prisma.user.groupBy({ by: ['role_key'], _count: { _all: true } });
  return Object.fromEntries(groups.map((g) => [String(g.role_key), g._count._all]));
};

/** Menyimpan data user baru (registrasi atau undangan staf). Mengembalikan ID baru. */
export const createUser = async (user: {
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  roleKey: RoleKey | null;
  initials: string;
  status: UserStatus;
}): Promise<number> => {
  const now = new Date();
  const created = await prisma.user.create({
    data: {
      username: user.username,
      password_hash: user.passwordHash,
      name: user.name,
      email: user.email,
      role_key: user.roleKey as UserRole | null,
      initials: user.initials,
      status: fromDbEnum<PrismaUserStatus>(user.status),
      created_at: now,
      updated_at: now,
    },
  });
  return Number(created.id);
};

export const updateUserPassword = async (id: number, passwordHash: string) => {
  await prisma.user.update({ where: { id: BigInt(id) }, data: { password_hash: passwordHash, updated_at: new Date() } });
};

export const updateUserRoleStatus = async (id: number, roleKey: RoleKey | null, status: UserStatus) => {
  await prisma.user.update({
    where: { id: BigInt(id) },
    data: { role_key: roleKey as UserRole | null, status: fromDbEnum<PrismaUserStatus>(status), updated_at: new Date() },
  });
};

/** Catat waktu terakhir pengguna aktif. */
export const touchLastSeen = async (id: number) => {
  await prisma.user.update({ where: { id: BigInt(id) }, data: { last_seen_at: new Date() } });
};

/** Jumlah & waktu pendaftaran tertua yang menunggu persetujuan (antrean dashboard). */
export const pendingUsersQueue = async () => {
  const where = { status: 'Menunggu_persetujuan' as const };
  const [count, oldest] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.aggregate({ where, _min: { created_at: true } }),
  ]);
  return { count, oldest: oldest._min.created_at ? sqlTime(oldest._min.created_at) : null };
};

/** Cari staf berdasarkan nama/email (`pattern` = pola LIKE "%kata%" dari likePattern). */
export const searchUsers = async (pattern: string, limit: number) => {
  const term = pattern.replace(/^%|%$/g, '').replace(/\\([\\%_])/g, '$1');
  const users = await prisma.user.findMany({
    where: { OR: [{ name: { contains: term } }, { email: { contains: term } }] },
    orderBy: { name: 'asc' },
    take: limit,
  });
  return users.map(toUser);
};
