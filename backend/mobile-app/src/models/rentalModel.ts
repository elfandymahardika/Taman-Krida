import pool, { Queryable } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { Approval, PaymentStatus } from '../lib/catalog';

/** Baris `rentals` (milik dashboard) + kontak dari `visitor_rentals` + tagihan dari `orders`. */
export interface VisitorRental {
  id: string;
  applicant: string;
  venue: string;
  date: string;
  start_time: string;
  end_time: string;
  activity: string;
  approval: Approval;
  admin_note: string | null;
  files_ok: number;
  submitted_at: string;
  decided_at: string | null;
  contact: string;
  notified_status: string;
  invoice_amount: number | null;
  invoice_payment: PaymentStatus | null;
  invoice_method: string | null;
  invoice_note: string | null;
  invoice_paid_at: string | null;
}

interface VisitorRentalRow extends RowDataPacket, VisitorRental {}

const SELECT = `
  SELECT r.*, vr.contact, vr.notified_status,
         o.amount AS invoice_amount, o.payment AS invoice_payment, COALESCE(o.method, o.proof_method) AS invoice_method,
         o.note AS invoice_note, o.paid_at AS invoice_paid_at
  FROM visitor_rentals vr
  JOIN rentals r ON r.id = vr.rental_id
  LEFT JOIN orders o ON o.rental_id = r.id`;

export const listVisitorRentals = async (visitorId: number) => {
  const [rows] = await pool.execute<VisitorRentalRow[]>(`${SELECT} WHERE vr.visitor_id = ? ORDER BY r.submitted_at DESC`, [visitorId]);
  return rows;
};

/** Satu pengajuan milik pengunjung; milik orang lain → null (dibalas 404, cegah IDOR). */
export const findVisitorRental = async (visitorId: number, id: string, db: Queryable = pool): Promise<VisitorRental | null> => {
  const [rows] = await db.execute<VisitorRentalRow[]>(`${SELECT} WHERE vr.visitor_id = ? AND r.id = ? LIMIT 1`, [visitorId, id]);
  return rows[0] ?? null;
};

/** Sewa yang memakai jadwal fasilitas: masih ditinjau atau sudah disetujui (yang ditolak melepas jadwalnya). */
export const rentalsAtVenue = async (venue: string, from: string, to: string, db: Queryable = pool) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT date, start_time, end_time FROM rentals WHERE venue = ? AND date BETWEEN ? AND ? AND approval != 'Ditolak'`,
    [venue, from, to],
  );
  return rows as { date: string; start_time: string; end_time: string }[];
};

/** Nomor urut terakhir (4 digit terakhir id SG-MMYY-0001), sama dengan penomoran dashboard. */
export const lastRentalNumber = async (db: Queryable = pool) => {
  const [[row]] = await db.execute<RowDataPacket[]>('SELECT MAX(CAST(RIGHT(id, 4) AS UNSIGNED)) AS last FROM rentals');
  return Number(row.last ?? 0);
};

/** Permintaan sewa dari aplikasi → antrean "Perlu ditinjau" di menu Sewa gedung dashboard. */
export const insertRental = async (
  r: { id: string; applicant: string; venue: string; date: string; start: string; end: string; activity: string; file: string },
  db: Queryable,
) => {
  await db.execute(
    `INSERT INTO rentals (id, applicant, venue, date, start_time, end_time, activity, approval, file, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Perlu ditinjau', ?, ?)`,
    [r.id, r.applicant, r.venue, r.date, r.start, r.end, r.activity, r.file, new Date()],
  );
};

export const linkVisitorRental = async (l: { rentalId: string; visitorId: number; contact: string; status: string }, db: Queryable) => {
  await db.execute(
    'REPLACE INTO visitor_rentals (rental_id, visitor_id, contact, notified_status, created_at) VALUES (?, ?, ?, ?, ?)',
    [l.rentalId, l.visitorId, l.contact, l.status, new Date()],
  );
};

export const setRentalNotified = async (id: string, status: string, db: Queryable = pool) => {
  await db.execute('UPDATE visitor_rentals SET notified_status = ? WHERE rental_id = ?', [status, id]);
};
