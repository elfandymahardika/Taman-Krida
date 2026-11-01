import pool, { Queryable } from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { iso } from '../lib/format';

/** Halaman aplikasi yang dibuka saat notifikasi ditekan (enum NotificationTarget di Flutter). */
export type NotificationTarget = 'rental' | 'event' | 'tickets' | 'communities' | 'calendar';

export interface NotificationInput {
  symbol: string;
  title: string;
  body: string;
  target: NotificationTarget;
  targetId?: string | null;
}

interface NotificationRow extends RowDataPacket {
  id: number;
  symbol: string;
  title: string;
  body: string;
  target: NotificationTarget;
  target_id: string | null;
  created_at: string;
  read_at: string | null;
}

export const toNotification = (n: NotificationRow) => ({
  id: n.id,
  symbol: n.symbol,
  title: n.title,
  body: n.body,
  target: n.target,
  targetId: n.target_id ?? undefined,
  createdAt: iso(n.created_at),
  read: Boolean(n.read_at),
});

export const insertNotification = async (visitorId: number, n: NotificationInput, db: Queryable = pool) => {
  await db.execute(
    'INSERT INTO visitor_notifications (visitor_id, symbol, title, body, target, target_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [visitorId, n.symbol, n.title.slice(0, 100), n.body.slice(0, 255), n.target, n.targetId ?? null, new Date()],
  );
};

export const listNotifications = async (visitorId: number, limit = 100) => {
  const [rows] = await pool.execute<NotificationRow[]>(
    `SELECT * FROM visitor_notifications WHERE visitor_id = ? ORDER BY id DESC LIMIT ${limit}`,
    [visitorId],
  );
  return rows;
};

/** Tandai dibaca; hanya notifikasi milik pengunjung yang berubah (0 baris = bukan miliknya → 404). */
export const markNotificationRead = async (visitorId: number, id: number) => {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE visitor_notifications SET read_at = COALESCE(read_at, ?) WHERE id = ? AND visitor_id = ?',
    [new Date(), id, visitorId],
  );
  return result.affectedRows > 0;
};

export const markAllNotificationsRead = async (visitorId: number) => {
  await pool.execute('UPDATE visitor_notifications SET read_at = ? WHERE visitor_id = ? AND read_at IS NULL', [new Date(), visitorId]);
};
