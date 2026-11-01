import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

export interface Facility {
  id: string;
  name: string;
  capacity: number | null;
  purpose: string;
  note: string | null;
  photo: string | null;
  bookable: number;
  sort: number;
}

export interface FacilityRow extends RowDataPacket, Facility {}

export const toFacility = (f: Facility) => ({
  id: f.id,
  name: f.name,
  capacity: f.capacity ?? undefined,
  purpose: f.purpose,
  note: f.note ?? undefined,
  photo: f.photo ?? undefined,
  bookable: Boolean(f.bookable),
});

export const findFacilityById = async (id: string): Promise<Facility | null> => {
  const [rows] = await pool.execute<FacilityRow[]>('SELECT * FROM facilities WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
};

export const listFacilities = async () => {
  const [rows] = await pool.execute<FacilityRow[]>('SELECT * FROM facilities ORDER BY sort');
  return rows;
};

/** Nama area sudah dipakai area lain (selain `excludeId`)? */
export const facilityNameTaken = async (name: string, excludeId = '') => {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT 1 FROM facilities WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1', [
    name,
    excludeId,
  ]);
  return rows.length > 0;
};

/** Area baru ditaruh paling akhir dan tidak dipakai sebagai lokasi acara/sewa. */
export const createFacility = async (f: { id: string; name: string; capacity: number | null; purpose: string; note: string | null }) => {
  const [[{ sort }]] = await pool.execute<RowDataPacket[]>('SELECT COALESCE(MAX(sort), -1) + 1 AS sort FROM facilities');
  await pool.execute('INSERT INTO facilities (id, name, capacity, purpose, note, sort) VALUES (?, ?, ?, ?, ?, ?)', [
    f.id,
    f.name,
    f.capacity,
    f.purpose,
    f.note,
    sort,
  ]);
};

export const updateFacility = async (id: string, f: { name: string; capacity: number | null; purpose: string; note: string | null }) => {
  await pool.execute('UPDATE facilities SET name = ?, capacity = ?, purpose = ?, note = ? WHERE id = ?', [
    f.name,
    f.capacity,
    f.purpose,
    f.note,
    id,
  ]);
};
