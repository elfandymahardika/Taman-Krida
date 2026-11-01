import pool, { Queryable } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { iso } from '../lib/format';
import { SqlValue } from '../lib/http';

export type CommunityStatus = 'Aktif' | 'Nonaktif' | 'Menunggu persetujuan' | 'Ditolak';

/** Baris `communities` (milik dashboard). */
export interface Community {
  id: string;
  name: string;
  category: string;
  city: string;
  members: number;
  contact: string;
  photo: string | null;
  status: CommunityStatus;
  leader: string | null;
  since: string | null;
  admin_note: string | null;
  applied_at: string | null;
}

interface CommunityRow extends RowDataPacket, Community {}

/** Profil di direktori publik (tanpa catatan admin). */
export const toCommunity = (c: Community) => ({
  id: c.id,
  name: c.name,
  category: c.category,
  city: c.city,
  members: c.members,
  contact: c.contact,
  photo: c.photo ?? undefined,
  leader: c.leader ?? undefined,
  since: c.since ?? undefined,
});

/** Komunitas aktif di direktori dengan filter tambahan (klausa dari helper `where()`). */
export const listActiveCommunities = async (filter: { sql: string; params: SqlValue[] }) => {
  const extra = filter.sql.replace(/^WHERE /, 'AND ');
  const [rows] = await pool.execute<CommunityRow[]>(`SELECT * FROM communities WHERE status = 'Aktif' ${extra} ORDER BY name`, filter.params);
  return rows;
};

export const findActiveCommunity = async (id: string): Promise<Community | null> => {
  const [rows] = await pool.execute<CommunityRow[]>(`SELECT * FROM communities WHERE status = 'Aktif' AND id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
};

export const communityIdTaken = async (id: string, db: Queryable = pool) => {
  const [rows] = await db.execute<RowDataPacket[]>('SELECT 1 FROM communities WHERE id = ? LIMIT 1', [id]);
  return rows.length > 0;
};

export const communityNameTaken = async (name: string) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 1 FROM communities WHERE LOWER(name) = LOWER(?) AND status != 'Ditolak' LIMIT 1`,
    [name],
  );
  return rows.length > 0;
};

/** Pendaftaran dari aplikasi → antrean "Menunggu persetujuan" di menu Komunitas dashboard. */
export const insertPendingCommunity = async (
  c: { id: string; name: string; category: string; city: string; members: number; contact: string; leader: string; since: string | null },
  db: Queryable,
) => {
  await db.execute(
    `INSERT INTO communities (id, name, category, city, members, contact, status, leader, since, applied_at)
     VALUES (?, ?, ?, ?, ?, ?, 'Menunggu persetujuan', ?, ?, ?)`,
    [c.id, c.name, c.category, c.city, c.members, c.contact, c.leader, c.since, new Date()],
  );
};

export const linkVisitorCommunity = async (
  l: { communityId: string; visitorId: number; address: string; description: string },
  db: Queryable,
) => {
  await db.execute(
    `REPLACE INTO visitor_communities (community_id, visitor_id, address, description, notified_status, created_at)
     VALUES (?, ?, ?, ?, 'Menunggu persetujuan', ?)`,
    [l.communityId, l.visitorId, l.address, l.description, new Date()],
  );
};

/** Pendaftaran komunitas milik pengunjung + status keputusan admin. */
export const listVisitorCommunities = async (visitorId: number) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT c.*, vc.address, vc.description, vc.notified_status FROM visitor_communities vc
     JOIN communities c ON c.id = vc.community_id WHERE vc.visitor_id = ? ORDER BY vc.created_at DESC`,
    [visitorId],
  );
  return rows as (Community & { address: string; description: string; notified_status: string })[];
};

export const toRegistration = (c: Community & { address: string; description: string }) => ({
  ...toCommunity(c),
  status: c.status,
  address: c.address,
  description: c.description,
  adminNote: c.admin_note ?? undefined,
  appliedAt: iso(c.applied_at),
});

export const setCommunityNotified = async (id: string, status: string, db: Queryable = pool) => {
  await db.execute('UPDATE visitor_communities SET notified_status = ? WHERE community_id = ?', [status, id]);
};
