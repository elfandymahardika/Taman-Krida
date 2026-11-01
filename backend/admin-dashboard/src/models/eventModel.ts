import pool, { Queryable, transaction } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { EVENTS } from '../db/seeders/data';
import { hhmm, iso } from '../lib/format';
import { SqlValue } from '../lib/http';

export type EventStatus = 'Terpublikasi' | 'Draf';

export interface Event {
  id: string;
  name: string;
  short: string;
  organizer: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  status: EventStatus;
  quota: number | null;
  sold: number | null;
  price: number | null;
  photo: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow extends RowDataPacket, Event {}

/** Data acara dari formulir / data contoh (jam berformat "HH:MM"). */
export interface EventInput {
  id: string;
  name: string;
  short?: string;
  organizer: string;
  date: string;
  start: string;
  end: string;
  venue: string;
  status: string;
  quota?: number | null;
  sold?: number | null;
  price?: number | null;
  photo?: string | null;
}

/** Baris database → JSON API. Kolom kosong dihilangkan (frontend memeriksa `quota !== undefined`). */
export const toEvent = (r: Event) => ({
  id: r.id,
  name: r.name,
  short: r.short,
  organizer: r.organizer,
  date: r.date,
  start: hhmm(r.start_time),
  end: hhmm(r.end_time),
  venue: r.venue,
  status: r.status,
  quota: r.quota ?? undefined,
  sold: r.sold ?? undefined,
  price: r.price ?? undefined,
  photo: r.photo ?? undefined,
  updatedAt: iso(r.updated_at),
});

export const findEventById = async (id: string, db: Queryable = pool): Promise<Event | null> => {
  const [rows] = await db.execute<EventRow[]>('SELECT * FROM events WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
};

/** Daftar acara dengan klausa WHERE dari helper `where()`. */
export const listEvents = async (filter: { sql: string; params: SqlValue[] } = { sql: '', params: [] }) => {
  const [rows] = await pool.execute<EventRow[]>(`SELECT * FROM events ${filter.sql} ORDER BY date, start_time`, filter.params);
  return rows;
};

/** Sudah ada acara bernama sama di tanggal yang sama (selain acara `excludeId`)? */
export const eventNameTaken = async (name: string, date: string, excludeId = '') => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT 1 FROM events WHERE LOWER(name) = LOWER(?) AND date = ? AND id != ? LIMIT 1',
    [name, date, excludeId],
  );
  return rows.length > 0;
};

/** Sisipkan acara, atau timpa acara dengan id yang sama (tanpa menghapus baris, agar tautan pesanan tetap utuh). */
export const upsertEvent = async (e: EventInput, now = new Date(), db: Queryable = pool) => {
  await db.execute(
    `INSERT INTO events (id, name, short, organizer, date, start_time, end_time, venue, status, quota, sold, price, photo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), short = VALUES(short), organizer = VALUES(organizer), date = VALUES(date),
       start_time = VALUES(start_time), end_time = VALUES(end_time), venue = VALUES(venue), status = VALUES(status),
       quota = VALUES(quota), sold = VALUES(sold), price = VALUES(price), photo = VALUES(photo), updated_at = VALUES(updated_at)`,
    [
      e.id,
      e.name,
      e.short ?? e.name,
      e.organizer,
      e.date,
      e.start,
      e.end,
      e.venue,
      e.status,
      e.quota ?? null,
      e.sold ?? (e.quota != null ? 0 : null),
      e.price ?? null,
      e.photo ?? null,
      now,
      now,
    ],
  );
};

export const updateEvent = async (
  id: string,
  e: { name: string; short: string; organizer: string; date: string; start: string; end: string; venue: string; status: string; quota: number | null; sold: number | null; price: number | null },
) => {
  await pool.execute(
    `UPDATE events SET name = ?, short = ?, organizer = ?, date = ?, start_time = ?, end_time = ?, venue = ?, status = ?,
            quota = ?, sold = ?, price = ?, updated_at = ? WHERE id = ?`,
    [e.name, e.short, e.organizer, e.date, e.start, e.end, e.venue, e.status, e.quota, e.sold, e.price, new Date(), id],
  );
};

/** Perubahan sebagian: status publikasi & inventori tiket. */
export const updateEventInventory = async (
  id: string,
  e: { status: string; quota: number | null; sold: number | null; price: number | null },
) => {
  await pool.execute('UPDATE events SET status = ?, quota = ?, sold = ?, price = ?, updated_at = ? WHERE id = ?', [
    e.status,
    e.quota,
    e.sold,
    e.price,
    new Date(),
    id,
  ]);
};

/** Tambah tiket terjual (dipanggil saat pembayaran tiket lunas). */
export const addTicketsSold = async (id: string, qty: number, db: Queryable = pool) => {
  await db.execute('UPDATE events SET sold = COALESCE(sold, 0) + ?, updated_at = ? WHERE id = ?', [qty, new Date(), id]);
};

export const deleteEvent = async (id: string) => {
  await pool.execute('DELETE FROM events WHERE id = ?', [id]);
};

/** Kembalikan tabel acara ke data contoh. */
export const resetSampleEvents = async () => {
  await transaction(async (conn) => {
    await conn.execute(`DELETE FROM events WHERE id NOT IN (${EVENTS.map(() => '?').join()})`, EVENTS.map((e) => e.id));
    for (const e of EVENTS) await upsertEvent(e, new Date('2026-09-01T00:00:00.000Z'), conn);
  });
};

/** Acara di fasilitas & tanggal yang sama dengan jam yang beririsan. */
export const overlappingEvents = async (venue: string, date: string, start: string, end: string) => {
  const [rows] = await pool.execute<EventRow[]>(
    'SELECT id, name, start_time, end_time FROM events WHERE venue = ? AND date = ? AND start_time < ? AND ? < end_time',
    [venue, date, end, start],
  );
  return rows;
};

export const searchEvents = async (pattern: string, limit: number) => {
  const [rows] = await pool.execute<EventRow[]>(
    `SELECT * FROM events WHERE name LIKE ? OR organizer LIKE ? ORDER BY date LIMIT ${limit}`,
    [pattern, pattern],
  );
  return rows;
};

/** Ringkasan acara & tiket dalam rentang tanggal (dashboard). */
export const eventMetrics = async (from: string, to: string) => {
  const [[events]] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total, SUM(status = 'Terpublikasi') AS published FROM events WHERE date BETWEEN ? AND ?`,
    [from, to],
  );
  const [[tickets]] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS events, SUM(sold) AS sold, SUM(quota) AS quota FROM events WHERE quota IS NOT NULL AND date BETWEEN ? AND ?`,
    [from, to],
  );
  return {
    events: { total: events.total, published: Number(events.published ?? 0), draft: events.total - Number(events.published ?? 0) },
    tickets: { events: tickets.events, sold: Number(tickets.sold ?? 0), quota: Number(tickets.quota ?? 0) },
  };
};
