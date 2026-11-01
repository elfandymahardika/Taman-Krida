import pool, { Queryable } from '../config/db';
import { insertActivity, insertNotification } from '../models/feedModel';
import { getSettings } from '../models/kvModel';

/** Catat log aktivitas yang tampil di dashboard (bisa dimatikan di Pengaturan → Keamanan). */
export async function logActivity(kind: string, title: string, sub: string, db: Queryable = pool) {
  if (!(await getSettings(db)).auditLog) return;
  await insertActivity(kind, title, sub, db);
}

const TOPIC_SETTING = { payment: 'notifyPayment', rental: 'notifyRental', community: 'notifyCommunity' } as const;

/** Tambah notifikasi admin (ikon lonceng). `topic` mengikuti sakelar di Pengaturan → Notifikasi. */
export async function notify(message: string, link: string | null, topic?: keyof typeof TOPIC_SETTING, db: Queryable = pool) {
  if (topic && !(await getSettings(db))[TOPIC_SETTING[topic]]) return;
  await insertNotification(message, link, db);
}
