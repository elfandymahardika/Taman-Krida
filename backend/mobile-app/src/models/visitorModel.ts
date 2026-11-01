import type { Visitor as PrismaVisitor } from '@prisma/client';
import pool, { Queryable } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { iso } from '../lib/format';
import prisma from '../lib/prisma';

/*
 * Akun pengunjung (tabel visitors) lewat Prisma Client. Bentuk data sama dengan versi SQL murni
 * sebelumnya (id number, waktu "YYYY-MM-DD HH:MM:SS.sss" UTC) agar controller lain tidak berubah.
 */

export interface Visitor {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

/** Date → "2026-10-02 02:30:00.000" (format DATETIME yang dipakai helper `iso()`). */
export const sqlTime = (d: Date) => d.toISOString().replace('T', ' ').replace('Z', '');

const toRow = (v: PrismaVisitor): Visitor => ({
  id: Number(v.id),
  name: v.name,
  email: v.email,
  phone: v.phone,
  city: v.city,
  password_hash: v.password_hash,
  created_at: sqlTime(v.created_at),
  updated_at: sqlTime(v.updated_at),
});

/** Profil yang dikirim ke aplikasi (tanpa hash password). */
export const toVisitor = (v: Visitor) => ({
  id: v.id,
  name: v.name,
  email: v.email,
  phone: v.phone,
  city: v.city ?? '',
  memberSince: Number(v.created_at.slice(0, 4)),
  createdAt: iso(v.created_at),
});

export const findVisitorById = async (id: number) => {
  const v = await prisma.visitor.findUnique({ where: { id: BigInt(id) } });
  return v ? toRow(v) : null;
};

export const findVisitorByEmail = async (email: string) => {
  const v = await prisma.visitor.findUnique({ where: { email } });
  return v ? toRow(v) : null;
};

/** Simpan akun baru; mengembalikan ID. Email ganda ditolak indeks UNIQUE (error P2002). */
export const createVisitor = async (v: { name: string; email: string; phone: string; city: string | null; passwordHash: string }) => {
  const now = new Date();
  const created = await prisma.visitor.create({
    data: { name: v.name, email: v.email, phone: v.phone, city: v.city, password_hash: v.passwordHash, created_at: now, updated_at: now },
  });
  return Number(created.id);
};

export const updateVisitorProfile = async (id: number, v: { name: string; email: string; phone: string; city: string | null }) => {
  await prisma.visitor.update({ where: { id: BigInt(id) }, data: { ...v, updated_at: new Date() } });
};

export const updateVisitorPassword = async (id: number, passwordHash: string) => {
  await prisma.visitor.update({ where: { id: BigInt(id) }, data: { password_hash: passwordHash, updated_at: new Date() } });
};

/** Ringkasan halaman Akun Saya: jumlah booking tiket, pengajuan sewa, komunitas, dan notifikasi belum dibaca. */
export const visitorStats = async (id: number, db: Queryable = pool) => {
  const [[row]] = await db.execute<RowDataPacket[]>(
    `SELECT
       (SELECT COUNT(DISTINCT vo.booking_code) FROM visitor_orders vo JOIN orders o ON o.id = vo.order_id WHERE vo.visitor_id = ?) AS bookings,
       (SELECT COUNT(*) FROM visitor_rentals vr JOIN rentals r ON r.id = vr.rental_id WHERE vr.visitor_id = ?) AS rentals,
       (SELECT COUNT(*) FROM visitor_communities vc JOIN communities c ON c.id = vc.community_id WHERE vc.visitor_id = ?) AS communities,
       (SELECT COUNT(*) FROM visitor_notifications WHERE visitor_id = ? AND read_at IS NULL) AS unread`,
    [id, id, id, id],
  );
  return {
    bookings: Number(row.bookings),
    rentals: Number(row.rentals),
    communities: Number(row.communities),
    unreadNotifications: Number(row.unread),
  };
};
