import pool from '../config/db';
import { RowDataPacket } from 'mysql2';
import { iso } from '../lib/format';

export type CommunityStatus = 'Aktif' | 'Nonaktif' | 'Menunggu persetujuan' | 'Ditolak';

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

export interface CommunityRow extends RowDataPacket, Community {}

export const toCommunity = (r: Community) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  city: r.city,
  members: r.members,
  contact: r.contact,
  photo: r.photo ?? undefined,
  status: r.status,
  leader: r.leader ?? undefined,
  since: r.since ?? undefined,
  adminNote: r.admin_note ?? undefined,
  appliedAt: iso(r.applied_at),
});

export const findCommunityById = async (id: string): Promise<Community | null> => {
  const [rows] = await pool.execute<CommunityRow[]>('SELECT * FROM communities WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
};

export const listCommunities = async () => {
  const [rows] = await pool.execute<CommunityRow[]>('SELECT * FROM communities ORDER BY name');
  return rows;
};

export const communityNameTaken = async (name: string) => {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT 1 FROM communities WHERE LOWER(name) = LOWER(?) LIMIT 1', [name]);
  return rows.length > 0;
};

/** Komunitas yang ditambahkan admin langsung aktif di direktori. */
export const createCommunity = async (c: {
  id: string;
  name: string;
  category: string;
  city: string;
  members: number;
  contact: string;
  note: string | null;
}) => {
  await pool.execute(
    `INSERT INTO communities (id, name, category, city, members, contact, photo, status, admin_note)
     VALUES (?, ?, ?, ?, ?, ?, 'topeng', 'Aktif', ?)`,
    [c.id, c.name, c.category, c.city, c.members, c.contact, c.note],
  );
};

export const updateCommunityStatus = async (id: string, status: CommunityStatus, note?: string | null) => {
  if (note === undefined) await pool.execute('UPDATE communities SET status = ? WHERE id = ?', [status, id]);
  else await pool.execute('UPDATE communities SET status = ?, admin_note = ? WHERE id = ?', [status, note, id]);
};

/** Antrean dashboard: pendaftaran komunitas yang menunggu persetujuan. */
export const pendingCommunitiesQueue = async () => {
  const [[row]] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS count, MIN(applied_at) AS oldest FROM communities WHERE status = 'Menunggu persetujuan'`,
  );
  return row as { count: number; oldest: string | null };
};

export const searchCommunities = async (pattern: string, limit: number) => {
  const [rows] = await pool.execute<CommunityRow[]>(
    `SELECT * FROM communities WHERE name LIKE ? OR city LIKE ? ORDER BY name LIMIT ${limit}`,
    [pattern, pattern],
  );
  return rows;
};
