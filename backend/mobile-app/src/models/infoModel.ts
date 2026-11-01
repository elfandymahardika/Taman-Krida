import pool from '../config/db';
import { RowDataPacket } from 'mysql2';
import { config } from '../config/env';
import { RENTAL_RATES } from '../lib/catalog';
import { iso } from '../lib/format';
import { SqlValue } from '../lib/http';

/*
 * Data informasi publik yang dikelola admin di dashboard (hanya dibaca aplikasi):
 * fasilitas, virtual galeri (`media`), dan konten (`contents`). Profil lembaga ada di adminModel (tabel kv).
 */

export interface Facility {
  id: string;
  name: string;
  capacity: number | null;
  purpose: string;
  note: string | null;
  photo: string | null;
  bookable: number;
  sort: number;
}

interface FacilityRow extends RowDataPacket, Facility {}

/** Fasilitas bisa disewa bila dipakai sebagai lokasi (bookable) dan punya tarif. */
export const rentalRateOf = (f: Facility) => (f.bookable ? (RENTAL_RATES[f.name] ?? null) : null);

export const toFacility = (f: Facility) => ({
  id: f.id,
  name: f.name,
  capacity: f.capacity ?? undefined,
  purpose: f.purpose,
  note: f.note ?? undefined,
  photo: f.photo ?? undefined,
  rentable: rentalRateOf(f) !== null,
  /** Tarif sewa per pemakaian (ditagihkan setelah admin menyetujui). */
  rentalRate: rentalRateOf(f) ?? undefined,
});

export const listFacilities = async () => {
  const [rows] = await pool.execute<FacilityRow[]>('SELECT * FROM facilities ORDER BY sort');
  return rows;
};

export const findFacilityById = async (id: string): Promise<Facility | null> => {
  const [rows] = await pool.execute<FacilityRow[]>('SELECT * FROM facilities WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
};

export interface Media {
  id: string;
  title: string;
  collection: string;
  date: string;
  type: 'Foto' | 'Video';
  photo: string | null;
  file: string | null;
  mime: string | null;
  credit: string;
  description: string | null;
  dims: string | null;
}

interface MediaRow extends RowDataPacket, Media {}

/** `photo` = kunci foto bawaan aplikasi; `url` = berkas unggahan admin (disajikan API dashboard). */
export const toMedia = (m: Media) => ({
  id: m.id,
  title: m.title,
  collection: m.collection,
  date: m.date,
  type: m.type,
  photo: m.photo ?? undefined,
  // Unggahan admin: URL Vercel Blob apa adanya, atau berkas lokal yang disajikan API dashboard.
  url: m.file ? (/^https?:\/\//.test(m.file) ? m.file : `${config.adminPublicUrl}/uploads/${m.file}`) : undefined,
  mime: m.mime ?? undefined,
  credit: m.credit,
  description: m.description ?? '',
  dims: m.dims ?? undefined,
});

/** Media terpublikasi dengan filter tambahan (klausa dari helper `where()`). */
export const listPublishedMedia = async (filter: { sql: string; params: SqlValue[] }) => {
  const extra = filter.sql.replace(/^WHERE /, 'AND ');
  const [rows] = await pool.execute<MediaRow[]>(
    `SELECT * FROM media WHERE status = 'Terpublikasi' ${extra} ORDER BY date DESC, created_at DESC`,
    filter.params,
  );
  return rows;
};

export const findPublishedMedia = async (id: string): Promise<Media | null> => {
  const [rows] = await pool.execute<MediaRow[]>(`SELECT * FROM media WHERE status = 'Terpublikasi' AND id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
};

export interface Content {
  id: string;
  title: string;
  type: string;
  author: string;
  summary: string | null;
  body: string | null;
  cta: string | null;
  link: string | null;
  is_hero: number;
  updated_at: string;
}

interface ContentRow extends RowDataPacket, Content {}

export const toContent = (c: Content) => ({
  id: c.id,
  title: c.title,
  type: c.type,
  author: c.author,
  summary: c.summary ?? '',
  body: c.body ?? '',
  cta: c.cta || undefined,
  link: c.link || undefined,
  isHero: Boolean(c.is_hero),
  updatedAt: iso(c.updated_at),
});

/** Konten terpublikasi, terbaru dulu. `type` kosong = semua jenis. */
export const listPublishedContents = async (type = '', limit = 50) => {
  const [rows] = await pool.execute<ContentRow[]>(
    `SELECT * FROM contents WHERE status = 'Terpublikasi' ${type ? 'AND type = ?' : ''} ORDER BY updated_at DESC LIMIT ${limit}`,
    type ? [type] : [],
  );
  return rows;
};

export const findPublishedContent = async (id: string): Promise<Content | null> => {
  const [rows] = await pool.execute<ContentRow[]>(`SELECT * FROM contents WHERE status = 'Terpublikasi' AND id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
};

/** Banner beranda yang sedang aktif. */
export const findHeroBanner = async (): Promise<Content | null> => {
  const [rows] = await pool.execute<ContentRow[]>(
    `SELECT * FROM contents WHERE status = 'Terpublikasi' AND type = 'Banner beranda' ORDER BY is_hero DESC, updated_at DESC LIMIT 1`,
  );
  return rows[0] ?? null;
};
