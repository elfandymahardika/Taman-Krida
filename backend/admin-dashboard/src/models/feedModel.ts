import pool, { Queryable } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { iso } from '../lib/format';
import { where } from '../lib/http';

export const ACTIVITY_KINDS = ['payment', 'event', 'rental', 'community', 'content', 'gallery', 'user', 'system'];

interface ActivityRow extends RowDataPacket {
  id: number;
  kind: string;
  title: string;
  sub: string;
  created_at: string;
}

interface NotificationRow extends RowDataPacket {
  id: number;
  message: string;
  link: string | null;
  created_at: string;
  read_at: string | null;
}

export const toActivity = (r: ActivityRow) => ({ id: r.id, kind: r.kind, title: r.title, sub: r.sub, createdAt: iso(r.created_at) });

export const toNotification = (n: NotificationRow) => ({
  id: n.id,
  message: n.message,
  link: n.link ?? undefined,
  createdAt: iso(n.created_at),
  read: Boolean(n.read_at),
});

/** Tambah satu baris log aktivitas. */
export const insertActivity = async (kind: string, title: string, sub: string, db: Queryable = pool) => {
  await db.execute('INSERT INTO activity (kind, title, sub, created_at) VALUES (?, ?, ?, ?)', [kind, title, sub, new Date()]);
};

/** Log aktivitas dengan paginasi kursor (`before` = id terakhir halaman sebelumnya). */
export const listActivity = async (opts: { before: number | null; kind: string | null; allowedKinds: string[]; limit: number }) => {
  const filter = where([
    opts.before && ['id < ?', opts.before],
    opts.kind && ['kind = ?', opts.kind],
    [`kind IN (${opts.allowedKinds.map(() => '?').join()})`, ...opts.allowedKinds],
  ]);
  const [rows] = await pool.execute<ActivityRow[]>(
    `SELECT * FROM activity ${filter.sql} ORDER BY id DESC LIMIT ${opts.limit}`,
    filter.params,
  );
  return rows;
};

export const insertNotification = async (message: string, link: string | null, db: Queryable = pool) => {
  await db.execute('INSERT INTO notifications (message, link, created_at) VALUES (?, ?, ?)', [message, link, new Date()]);
};

export const listNotifications = async () => {
  const [rows] = await pool.execute<NotificationRow[]>('SELECT * FROM notifications ORDER BY id DESC');
  return rows;
};

export const markNotificationsRead = async (ids: number[]) => {
  if (!ids.length) return;
  await pool.execute(`UPDATE notifications SET read_at = ? WHERE read_at IS NULL AND id IN (${ids.map(() => '?').join()})`, [
    new Date(),
    ...ids,
  ]);
};
