import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { iso } from '../lib/format';

export type NoteStatus = 'Draf' | 'Terpublikasi' | 'Diarsipkan';

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string | null;
  status: NoteStatus;
  created_at: string;
  updated_at: string;
  /** Nama pemilik (hasil JOIN), untuk tampilan supervisi admin. */
  owner_name?: string;
}

export interface NoteRow extends RowDataPacket, Note {}

export interface NoteInput {
  title: string;
  content: string | null;
  status: NoteStatus;
}

const SELECT = 'SELECT n.*, u.name AS owner_name FROM notes n JOIN users u ON u.id = n.user_id';

export const toNote = (n: Note) => ({
  id: n.id,
  userId: n.user_id,
  owner: n.owner_name,
  title: n.title,
  content: n.content ?? '',
  status: n.status,
  createdAt: iso(n.created_at),
  updatedAt: iso(n.updated_at),
});

/**
 * Catatan milik satu user. `userId` selalu berasal dari sesi login (res.locals.userId), bukan dari input klien.
 */
export const listNotesByUser = async (userId: number) => {
  const [rows] = await pool.execute<NoteRow[]>(`${SELECT} WHERE n.user_id = ? ORDER BY n.updated_at DESC`, [userId]);
  return rows;
};

/** Semua catatan (supervisi Administrator utama). */
export const listAllNotes = async () => {
  const [rows] = await pool.execute<NoteRow[]>(`${SELECT} ORDER BY n.updated_at DESC`);
  return rows;
};

/**
 * Cari catatan berpagar kepemilikan: WHERE id = ? AND user_id = ?.
 * `userId` null = tanpa filter pemilik (khusus admin).
 */
export const findNote = async (id: number, userId: number | null): Promise<Note | null> => {
  const [rows] =
    userId === null
      ? await pool.execute<NoteRow[]>(`${SELECT} WHERE n.id = ? LIMIT 1`, [id])
      : await pool.execute<NoteRow[]>(`${SELECT} WHERE n.id = ? AND n.user_id = ? LIMIT 1`, [id, userId]);
  return rows[0] ?? null;
};

export const createNote = async (userId: number, data: NoteInput): Promise<number> => {
  const now = new Date();
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO notes (user_id, title, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, data.title, data.content, data.status, now, now],
  );
  return result.insertId;
};

/**
 * Ubah catatan. Query selalu menyertakan pemilik (anti-IDOR) kecuali `userId` null (admin).
 * Mengembalikan jumlah baris yang berubah: 0 = tidak ditemukan / bukan milik user.
 */
export const updateNote = async (id: number, userId: number | null, data: NoteInput) => {
  const params = [data.title, data.content, data.status, new Date(), id];
  const [result] =
    userId === null
      ? await pool.execute<ResultSetHeader>('UPDATE notes SET title = ?, content = ?, status = ?, updated_at = ? WHERE id = ?', params)
      : await pool.execute<ResultSetHeader>(
          'UPDATE notes SET title = ?, content = ?, status = ?, updated_at = ? WHERE id = ? AND user_id = ?',
          [...params, userId],
        );
  return result.affectedRows;
};

/** Hapus catatan berpagar pemilik (anti-IDOR); `userId` null = admin. */
export const deleteNote = async (id: number, userId: number | null) => {
  const [result] =
    userId === null
      ? await pool.execute<ResultSetHeader>('DELETE FROM notes WHERE id = ?', [id])
      : await pool.execute<ResultSetHeader>('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows;
};

/** Ubah status saja (moderasi admin: arsipkan). */
export const setNoteStatus = async (id: number, status: NoteStatus) => {
  const [result] = await pool.execute<ResultSetHeader>('UPDATE notes SET status = ?, updated_at = ? WHERE id = ?', [status, new Date(), id]);
  return result.affectedRows;
};
