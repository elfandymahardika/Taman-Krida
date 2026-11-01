import pool, { Queryable } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { eventCategory } from '../lib/catalog';
import { hhmm, iso } from '../lib/format';
import { SqlValue } from '../lib/http';

/** Baris tabel `events` (milik dashboard) + jumlah tiket yang sedang dipesan. */
export interface Event {
  id: string;
  name: string;
  short: string;
  organizer: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  status: 'Terpublikasi' | 'Draf';
  quota: number | null;
  sold: number | null;
  price: number | null;
  photo: string | null;
  updated_at: string;
  /** Tiket dalam pesanan yang belum lunas tapi masih menahan kursi (lihat reservedSql). */
  reserved: number;
}

export interface EventRow extends RowDataPacket, Event {}

/** Acara bertiket = admin mengisi kuota dan harga. */
export const isTicketed = (e: Event) => e.quota != null && e.price != null;

/** Sisa kursi: kuota − terjual (lunas) − sedang dipesan. */
export const remainingOf = (e: Event) => (isTicketed(e) ? Math.max(0, e.quota! - (e.sold ?? 0) - Number(e.reserved)) : null);

/** Baris database → JSON API untuk aplikasi. */
export const toEvent = (e: Event) => ({
  id: e.id,
  name: e.name,
  short: e.short,
  category: eventCategory(e.name),
  organizer: e.organizer,
  date: e.date,
  start: hhmm(e.start_time),
  end: hhmm(e.end_time),
  venue: e.venue,
  photo: e.photo ?? undefined,
  ticketed: isTicketed(e),
  price: e.price ?? 0,
  quota: e.quota ?? undefined,
  remaining: remainingOf(e) ?? undefined,
  updatedAt: iso(e.updated_at),
});

/**
 * Tiket yang menahan kursi: bukti transfer sedang diverifikasi, atau belum dibayar tapi masih dalam
 * batas waktu bayar (Pengaturan → Tiket → Batas bayar). Pesanan kedaluwarsa tidak lagi menahan kursi.
 */
const reservedSql = `
  LEFT JOIN (
    SELECT event_id, SUM(qty) AS reserved FROM orders
    WHERE type = 'Tiket' AND (payment = 'Perlu verifikasi' OR (payment = 'Menunggu bayar' AND created_at > ?))
    GROUP BY event_id
  ) r ON r.event_id = e.id`;

const holdSince = (holdHours: number) => new Date(Date.now() - holdHours * 3600e3);

/** Acara terpublikasi dengan filter tambahan (klausa dari helper `where()`, kolom berawalan `e.`). */
export const listPublishedEvents = async (filter: { sql: string; params: SqlValue[] }, holdHours: number, limit = 200) => {
  const extra = filter.sql.replace(/^WHERE /, 'AND ');
  const [rows] = await pool.execute<EventRow[]>(
    `SELECT e.*, COALESCE(r.reserved, 0) AS reserved FROM events e ${reservedSql}
     WHERE e.status = 'Terpublikasi' ${extra} ORDER BY e.date, e.start_time LIMIT ${limit}`,
    [holdSince(holdHours), ...filter.params],
  );
  return rows;
};

/** Satu acara terpublikasi. `lock` = kunci baris acara selama transaksi checkout (cegah kuota terlampaui). */
export const findPublishedEvent = async (id: string, holdHours: number, db: Queryable = pool, lock = false): Promise<Event | null> => {
  if (lock) await db.execute('SELECT id FROM events WHERE id = ? FOR UPDATE', [id]);
  const [rows] = await db.execute<EventRow[]>(
    `SELECT e.*, COALESCE(r.reserved, 0) AS reserved FROM events e ${reservedSql}
     WHERE e.status = 'Terpublikasi' AND e.id = ? LIMIT 1`,
    [holdSince(holdHours), id],
  );
  return rows[0] ?? null;
};

/** Acara (semua status) di fasilitas & rentang tanggal, untuk kalender ketersediaan sewa. */
export const eventsAtVenue = async (venue: string, from: string, to: string, db: Queryable = pool) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT date, start_time, end_time FROM events WHERE venue = ? AND date BETWEEN ? AND ?',
    [venue, from, to],
  );
  return rows as { date: string; start_time: string; end_time: string }[];
};
