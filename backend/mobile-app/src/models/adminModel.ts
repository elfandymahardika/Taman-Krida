import pool, { Queryable } from '../config/db';
import { RowDataPacket } from 'mysql2';

/*
 * Tabel milik dashboard admin yang ikut ditulis/dibaca aplikasi mobile:
 * `kv` (profil lembaga & pengaturan panel), `activity` (log aktivitas), `notifications` (lonceng admin).
 */

/** Pengaturan panel yang dipakai API mobile (bawaan sama dengan DEFAULT_SETTINGS di dashboard). */
const DEFAULT_SETTINGS = {
  notifyPayment: true,
  notifyRental: true,
  notifyCommunity: true,
  auditLog: true,
  maxTickets: '10',
  payDeadline: '24 jam',
  cancelPolicy: 'Pembatalan paling lambat H-3 acara, dana kembali 50%.',
  method: 'Transfer bank & QRIS',
  bank: 'Bank Jatim',
  account: '0011 2233 4455 (contoh)',
};

export type PanelSettings = typeof DEFAULT_SETTINGS;

interface KvRow extends RowDataPacket {
  value: string;
}

export const readKv = async <T>(name: string, db: Queryable = pool): Promise<T | null> => {
  const [rows] = await db.execute<KvRow[]>('SELECT value FROM kv WHERE name = ? LIMIT 1', [name]);
  return rows[0] ? (JSON.parse(rows[0].value) as T) : null;
};

/** Pengaturan yang berlaku (bawaan + yang disimpan admin di Pengaturan). */
export const getSettings = async (db: Queryable = pool): Promise<PanelSettings> => ({
  ...DEFAULT_SETTINGS,
  ...((await readKv<Partial<PanelSettings>>('settings', db)) ?? {}),
});

/** "10" → 10 tiket per acara dalam satu pesanan. */
export const maxTickets = (s: PanelSettings) => parseInt(s.maxTickets, 10) || 10;

/** "24 jam" → 24 (batas waktu bayar sejak pesanan dibuat). */
export const payDeadlineHours = (s: PanelSettings) => parseInt(s.payDeadline, 10) || 24;

/** Catat log aktivitas di dashboard (bisa dimatikan admin di Pengaturan → Keamanan). */
export async function logActivity(kind: string, title: string, sub: string, db: Queryable = pool) {
  if (!(await getSettings(db)).auditLog) return;
  await db.execute('INSERT INTO activity (kind, title, sub, created_at) VALUES (?, ?, ?, ?)', [kind, title, sub, new Date()]);
}

const TOPIC_SETTING = { payment: 'notifyPayment', rental: 'notifyRental', community: 'notifyCommunity' } as const;

/** Notifikasi lonceng admin. `link` = halaman dashboard yang dibuka, mengikuti sakelar di Pengaturan → Notifikasi. */
export async function notifyAdmin(message: string, link: string, topic: keyof typeof TOPIC_SETTING, db: Queryable = pool) {
  if (!(await getSettings(db))[TOPIC_SETTING[topic]]) return;
  await db.execute('INSERT INTO notifications (message, link, created_at) VALUES (?, ?, ?)', [message, link, new Date()]);
}
