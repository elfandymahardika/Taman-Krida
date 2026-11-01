import pool from '../config/db';
import { RowDataPacket } from 'mysql2';
import { iso } from '../lib/format';

export interface Content {
  id: string;
  title: string;
  type: string;
  author: string;
  status: 'Terpublikasi' | 'Terjadwal' | 'Draf';
  summary: string | null;
  body: string | null;
  cta: string | null;
  link: string | null;
  publish_from: string | null;
  publish_to: string | null;
  is_hero: number;
  updated_at: string;
}

export interface ContentRow extends RowDataPacket, Content {}

export const toContent = (c: Content) => ({
  id: c.id,
  title: c.title,
  type: c.type,
  author: c.author,
  status: c.status,
  summary: c.summary ?? '',
  body: c.body ?? '',
  cta: c.cta ?? '',
  link: c.link ?? '',
  publishFrom: c.publish_from ?? undefined,
  publishTo: c.publish_to ?? undefined,
  isHero: Boolean(c.is_hero),
  updatedAt: iso(c.updated_at),
});

export const findContentById = async (id: string): Promise<Content | null> => {
  const [rows] = await pool.execute<ContentRow[]>('SELECT * FROM contents WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
};

export const listContents = async () => {
  const [rows] = await pool.execute<ContentRow[]>('SELECT * FROM contents ORDER BY updated_at DESC');
  return rows;
};

/** Konten baru selalu berstatus Draf. */
export const createContent = async (c: { id: string; title: string; type: string; author: string; summary: string | null }) => {
  await pool.execute(
    `INSERT INTO contents (id, title, type, author, status, summary, updated_at) VALUES (?, ?, ?, ?, 'Draf', ?, ?)`,
    [c.id, c.title, c.type, c.author, c.summary, new Date()],
  );
};

export const updateContent = async (
  id: string,
  c: { title: string; type: string; status: string; summary: string | null; body: string | null; cta: string | null; link: string | null; author: string },
) => {
  await pool.execute(
    `UPDATE contents SET title = ?, type = ?, status = ?, summary = ?, body = ?, cta = ?, link = ?, author = ?, updated_at = ? WHERE id = ?`,
    [c.title, c.type, c.status, c.summary, c.body, c.cta, c.link, c.author, new Date(), id],
  );
};

export const searchContents = async (pattern: string, limit: number) => {
  const [rows] = await pool.execute<ContentRow[]>(
    `SELECT * FROM contents WHERE title LIKE ? ORDER BY updated_at DESC LIMIT ${limit}`,
    [pattern],
  );
  return rows;
};
