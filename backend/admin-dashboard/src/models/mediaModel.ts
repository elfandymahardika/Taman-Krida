import pool from '../config/db';
import { RowDataPacket } from 'mysql2';
import { iso } from '../lib/format';
import { SqlValue } from '../lib/http';
import { publicUrl } from '../services/storage.service';

export interface Media {
  id: string;
  title: string;
  collection: string;
  date: string;
  type: 'Foto' | 'Video';
  photo: string | null;
  file: string | null;
  mime: string | null;
  status: 'Terpublikasi' | 'Draf';
  credit: string;
  description: string | null;
  bytes: number;
  dims: string | null;
  created_at: string;
}

export interface MediaRow extends RowDataPacket, Media {}

export const toMedia = (m: Media) => ({
  id: m.id,
  title: m.title,
  collection: m.collection,
  date: m.date,
  type: m.type,
  photo: m.photo ?? undefined,
  // Berkas unggahan: URL Vercel Blob, atau berkas lokal yang disajikan di /uploads.
  url: m.file ? publicUrl(m.file) : undefined,
  mime: m.mime ?? undefined,
  status: m.status,
  credit: m.credit,
  description: m.description ?? '',
  bytes: Number(m.bytes),
  dims: m.dims ?? undefined,
  createdAt: iso(m.created_at),
});

export const findMediaById = async (id: string): Promise<Media | null> => {
  const [rows] = await pool.execute<MediaRow[]>('SELECT * FROM media WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
};

export const listMedia = async (filter: { sql: string; params: SqlValue[] }) => {
  const [rows] = await pool.execute<MediaRow[]>(`SELECT * FROM media ${filter.sql} ORDER BY date DESC, created_at DESC`, filter.params);
  return rows;
};

/** Berkas unggahan baru selalu berstatus Draf. */
export const createMedia = async (m: {
  id: string;
  title: string;
  collection: string;
  date: string;
  type: 'Foto' | 'Video';
  file: string;
  mime: string;
  credit: string;
  description: string | null;
  bytes: number;
}) => {
  await pool.execute(
    `INSERT INTO media (id, title, collection, date, type, file, mime, status, credit, description, bytes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Draf', ?, ?, ?, ?)`,
    [m.id, m.title, m.collection, m.date, m.type, m.file, m.mime, m.credit, m.description, m.bytes, new Date()],
  );
};

export const updateMediaMeta = async (
  id: string,
  m: { title: string; collection: string; description: string | null; credit: string; date: string },
) => {
  await pool.execute('UPDATE media SET title = ?, collection = ?, description = ?, credit = ?, date = ? WHERE id = ?', [
    m.title,
    m.collection,
    m.description,
    m.credit,
    m.date,
    id,
  ]);
};

export const updateMediaStatus = async (id: string, status: string) => {
  await pool.execute('UPDATE media SET status = ? WHERE id = ?', [status, id]);
};

export const deleteMedia = async (id: string) => {
  await pool.execute('DELETE FROM media WHERE id = ?', [id]);
};

export const searchMedia = async (pattern: string, limit: number) => {
  const [rows] = await pool.execute<MediaRow[]>(
    `SELECT * FROM media WHERE title LIKE ? OR collection LIKE ? ORDER BY date DESC LIMIT ${limit}`,
    [pattern, pattern],
  );
  return rows;
};
