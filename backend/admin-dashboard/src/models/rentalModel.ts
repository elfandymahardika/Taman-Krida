import pool, { Queryable } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { SqlValue } from '../lib/http';

export type Approval = 'Perlu ditinjau' | 'Disetujui' | 'Ditolak';

export interface Rental {
  id: string;
  applicant: string;
  venue: string;
  date: string;
  start_time: string;
  end_time: string;
  activity: string;
  approval: Approval;
  file: string | null;
  admin_note: string | null;
  files_ok: number;
  submitted_at: string;
  decided_at: string | null;
}

export interface RentalRow extends RowDataPacket, Rental {}

export const findRentalById = async (id: string): Promise<Rental | null> => {
  const [rows] = await pool.execute<RentalRow[]>('SELECT * FROM rentals WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
};

export const listRentals = async (filter: { sql: string; params: SqlValue[] }) => {
  const [rows] = await pool.execute<RentalRow[]>(`SELECT * FROM rentals ${filter.sql} ORDER BY date, start_time`, filter.params);
  return rows;
};

/** Sewa yang sudah disetujui di fasilitas & tanggal yang sama dengan jam beririsan (selain `excludeId`). */
export const overlappingRentals = async (venue: string, date: string, start: string, end: string, excludeId = '') => {
  const [rows] = await pool.execute<RentalRow[]>(
    `SELECT id, applicant, start_time, end_time FROM rentals
     WHERE approval = 'Disetujui' AND venue = ? AND date = ? AND start_time < ? AND ? < end_time AND id != ?`,
    [venue, date, end, start, excludeId],
  );
  return rows;
};

/** Nomor urut terakhir (4 digit terakhir id SG-MMYY-0001). */
export const lastRentalNumber = async () => {
  const [[row]] = await pool.execute<RowDataPacket[]>('SELECT MAX(CAST(RIGHT(id, 4) AS UNSIGNED)) AS last FROM rentals');
  return Number(row.last ?? 0);
};

export const createRental = async (r: {
  id: string;
  applicant: string;
  venue: string;
  date: string;
  start: string;
  end: string;
  activity: string;
  note: string | null;
}) => {
  await pool.execute(
    `INSERT INTO rentals (id, applicant, venue, date, start_time, end_time, activity, approval, admin_note, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Perlu ditinjau', ?, ?)`,
    [r.id, r.applicant, r.venue, r.date, r.start, r.end, r.activity, r.note, new Date()],
  );
};

/** Simpan keputusan admin (disetujui / ditolak). */
export const decideRental = async (id: string, approval: Approval, note: string | null, db: Queryable = pool) => {
  await db.execute('UPDATE rentals SET approval = ?, admin_note = ?, decided_at = ? WHERE id = ?', [approval, note, new Date(), id]);
};

export const markRentalFilesComplete = async (id: string) => {
  await pool.execute('UPDATE rentals SET files_ok = 1 WHERE id = ?', [id]);
};

/** Ringkasan sewa dalam rentang tanggal (dashboard). */
export const rentalMetrics = async (from: string, to: string) => {
  const [[r]] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total, SUM(approval = 'Disetujui') AS approved, SUM(approval = 'Perlu ditinjau') AS pending,
            SUM(approval = 'Ditolak') AS rejected
     FROM rentals WHERE date BETWEEN ? AND ?`,
    [from, to],
  );
  return {
    total: r.total as number,
    approved: Number(r.approved ?? 0),
    pending: Number(r.pending ?? 0),
    rejected: Number(r.rejected ?? 0),
  };
};

/** Antrean dashboard: permintaan sewa yang belum ditinjau. */
export const pendingRentalsQueue = async () => {
  const [[row]] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS count, MIN(submitted_at) AS oldest FROM rentals WHERE approval = 'Perlu ditinjau'`,
  );
  return row as { count: number; oldest: string | null };
};

export const searchRentals = async (pattern: string, limit: number) => {
  const [rows] = await pool.execute<RentalRow[]>(
    `SELECT * FROM rentals WHERE id LIKE ? OR applicant LIKE ? ORDER BY date LIMIT ${limit}`,
    [pattern, pattern],
  );
  return rows;
};
