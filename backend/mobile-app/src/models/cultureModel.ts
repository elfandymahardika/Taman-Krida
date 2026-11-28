import pool from '../config/db';
import { RowDataPacket } from 'mysql2';
import { adminFileUrl } from '../lib/adminFiles';
import { iso } from '../lib/format';

/*
 * Materi Edukasi Budaya (tabel `culture_topics`, dikelola admin di dashboard → menu Edukasi).
 * Aplikasi hanya membaca materi berstatus Terpublikasi.
 */

/** Kunci foto bawaan aplikasi (aset di APK, lihat Visuals.photo di Flutter). Selain ini = berkas unggahan admin. */
const BUILTIN_PHOTOS = ['wayang', 'topeng', 'ketoprak', 'pendopo', 'panggung', 'gedung', 'parkir', 'gamelan', 'sanggar', 'jaranan'];

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
  video_file: string | null;
  video_link: string | null;
  status: 'Terpublikasi' | 'Draf';
  updated_at: string;
}

interface CultureTopicRow extends RowDataPacket, CultureTopic {}

/** Teks JSON kolom → array; isi rusak dianggap kosong. */
const parseList = <T>(json: string): T[] => {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

/**
 * Video materi untuk aplikasi: `file` = diputar di aplikasi (unggahan admin, atau tautan langsung ke berkas
 * .mp4/.webm/.mov), `youtube` / `link` = dibuka di aplikasi YouTube atau browser.
 */
export const videoOf = (c: Pick<CultureTopic, 'video_file' | 'video_link'>) => {
  if (c.video_file) return { type: 'file' as const, url: adminFileUrl(c.video_file) };
  if (!c.video_link) return null;
  let host = '';
  let path = '';
  try {
    ({ hostname: host, pathname: path } = new URL(c.video_link));
  } catch {
    return null;
  }
  if (/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/i.test(host)) return { type: 'youtube' as const, url: c.video_link };
  if (/\.(mp4|webm|mov|m4v)$/i.test(path)) return { type: 'file' as const, url: c.video_link };
  return { type: 'link' as const, url: c.video_link };
};

export type TimelinePoint = { label: string; text: string };
export type PhilosophyPoint = { symbol: string; title: string; text: string };

/** Baris database → JSON API aplikasi. `photos`: kunci foto bawaan apa adanya, unggahan → URL; pertama = sampul. */
export const toCultureTopic = (c: CultureTopic) => ({
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
  photos: parseList<string>(c.images)
    .filter((k) => typeof k === 'string' && k)
    .map((k) => (BUILTIN_PHOTOS.includes(k) ? k : adminFileUrl(k))),
  videoMinutes: c.video_minutes,
  video: videoOf(c),
  updatedAt: iso(c.updated_at),
});

/** Materi terpublikasi sesuai urutan dibuat (urutan kartu di aplikasi). */
export const listPublishedCultureTopics = async () => {
  const [rows] = await pool.execute<CultureTopicRow[]>(
    `SELECT * FROM culture_topics WHERE status = 'Terpublikasi' ORDER BY created_at ASC`,
  );
  return rows;
};

export const findPublishedCultureTopic = async (id: string): Promise<CultureTopic | null> => {
  const [rows] = await pool.execute<CultureTopicRow[]>(
    `SELECT * FROM culture_topics WHERE status = 'Terpublikasi' AND id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
};
