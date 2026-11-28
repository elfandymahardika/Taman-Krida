import pool from '../config/db';
import { RowDataPacket } from 'mysql2';
import { iso } from '../lib/format';
import { publicUrl } from '../services/storage.service';

/** Satu poin linimasa (tab Sejarah) dan satu makna (tab Filosofi) di aplikasi. */
export type TimelinePoint = { label: string; text: string };
export type PhilosophyPoint = { symbol: string; title: string; text: string };

/**
 * Kunci foto bawaan aplikasi mobile (aset di dalam APK). Selain kunci ini, isi `images` adalah berkas
 * unggahan admin (nama berkas di uploads/ atau URL Vercel Blob folder "edukasi").
 */
export const BUILTIN_PHOTOS = ['wayang', 'topeng', 'ketoprak', 'pendopo', 'panggung', 'gedung', 'parkir', 'gamelan', 'sanggar', 'jaranan'];

export const isBuiltinPhoto = (key: string) => BUILTIN_PHOTOS.includes(key);

/** Baris tabel `culture_topics` (kolom JSON masih berupa teks). */
export interface CultureTopic {
  id: string;
  title: string;
  category: string;
  summary: string;
  headline: string;
  read_minutes: number;
  history: string;
  timeline_title: string;
  timeline: string;
  philosophy: string;
  images: string;
  video_minutes: number;
  /** Video unggahan (nama berkas / URL Vercel Blob) — atau `video_link`, tidak keduanya. */
  video_file: string | null;
  /** Tautan video luar (YouTube atau URL berkas video). */
  video_link: string | null;
  status: 'Terpublikasi' | 'Draf';
  author: string;
  created_at: string;
  updated_at: string;
}

interface CultureTopicRow extends RowDataPacket, CultureTopic {}

/** Data materi yang sudah divalidasi (validateCulture). */
export type CultureInput = {
  title: string;
  category: string;
  summary: string;
  headline: string;
  readMinutes: number;
  history: string;
  timelineTitle: string;
  timeline: TimelinePoint[];
  philosophy: PhilosophyPoint[];
  videoMinutes: number;
  status: 'Terpublikasi' | 'Draf';
};

/** Teks JSON kolom → array; isi rusak dianggap kosong agar satu baris tidak menggagalkan daftar. */
export const parseList = <T>(json: string): T[] => {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const imagesOf = (c: CultureTopic) => parseList<string>(c.images).filter((k) => typeof k === 'string' && k);

/** Baris database → JSON API dashboard. Foto bawaan dikirim sebagai `builtin`, unggahan sebagai `url`. */
export const toCulture = (c: CultureTopic) => ({
  id: c.id,
  title: c.title,
  category: c.category,
  summary: c.summary,
  headline: c.headline,
  readMinutes: c.read_minutes,
  history: c.history,
  timelineTitle: c.timeline_title,
  timeline: parseList<TimelinePoint>(c.timeline),
  philosophy: parseList<PhilosophyPoint>(c.philosophy),
  images: imagesOf(c).map((key) => (isBuiltinPhoto(key) ? { key, builtin: key } : { key, url: publicUrl(key) })),
  videoMinutes: c.video_minutes,
  video: c.video_file
    ? { kind: 'file' as const, url: publicUrl(c.video_file) }
    : c.video_link
      ? { kind: 'link' as const, url: c.video_link }
      : null,
  status: c.status,
  author: c.author,
  createdAt: iso(c.created_at),
  updatedAt: iso(c.updated_at),
});

export const listCultureTopics = async () => {
  const [rows] = await pool.execute<CultureTopicRow[]>('SELECT * FROM culture_topics ORDER BY created_at ASC');
  return rows;
};

export const findCultureTopic = async (id: string): Promise<CultureTopic | null> => {
  const [rows] = await pool.execute<CultureTopicRow[]>('SELECT * FROM culture_topics WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
};

/** Kolom isi materi (tanpa foto) dalam urutan SQL di bawah. */
const contentValues = (c: CultureInput, author: string) => [
  c.title,
  c.category,
  c.summary,
  c.headline,
  c.readMinutes,
  c.history,
  c.timelineTitle,
  JSON.stringify(c.timeline),
  JSON.stringify(c.philosophy),
  c.videoMinutes,
  c.status,
  author,
];

export const createCultureTopic = async (id: string, c: CultureInput, author: string) => {
  const now = new Date();
  await pool.execute(
    `INSERT INTO culture_topics (title, category, summary, headline, read_minutes, history, timeline_title, timeline, philosophy,
       video_minutes, status, author, id, images, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?)`,
    [...contentValues(c, author), id, now, now],
  );
};

export const updateCultureTopic = async (id: string, c: CultureInput, author: string) => {
  await pool.execute(
    `UPDATE culture_topics SET title = ?, category = ?, summary = ?, headline = ?, read_minutes = ?, history = ?,
       timeline_title = ?, timeline = ?, philosophy = ?, video_minutes = ?, status = ?, author = ?, updated_at = ?
     WHERE id = ?`,
    [...contentValues(c, author), new Date(), id],
  );
};

export const setCultureStatus = async (id: string, status: string, author: string) => {
  await pool.execute('UPDATE culture_topics SET status = ?, author = ?, updated_at = ? WHERE id = ?', [status, author, new Date(), id]);
};

export const setCultureImages = async (id: string, images: string[]) => {
  await pool.execute('UPDATE culture_topics SET images = ?, updated_at = ? WHERE id = ?', [JSON.stringify(images), new Date(), id]);
};

/** Ganti video materi (berkas ATAU tautan; keduanya null = tanpa video). */
export const setCultureVideo = async (id: string, video: { file: string | null; link: string | null }) => {
  await pool.execute('UPDATE culture_topics SET video_file = ?, video_link = ?, updated_at = ? WHERE id = ?', [video.file, video.link, new Date(), id]);
};

export const deleteCultureTopic = async (id: string) => {
  await pool.execute('DELETE FROM culture_topics WHERE id = ?', [id]);
};

export const cultureIdExists = async (id: string) => Boolean(await findCultureTopic(id));

export const searchCultureTopics = async (pattern: string, limit: number) => {
  const [rows] = await pool.execute<CultureTopicRow[]>(
    `SELECT * FROM culture_topics WHERE title LIKE ? OR category LIKE ? ORDER BY created_at ASC LIMIT ${limit}`,
    [pattern, pattern],
  );
  return rows;
};
