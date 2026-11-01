import pool, { Queryable } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { iso } from '../lib/format';

export type FileKind = 'ktp' | 'surat' | 'proposal' | 'bukti';

export interface VisitorFile {
  id: string;
  visitor_id: number;
  kind: FileKind;
  ref: string;
  name: string;
  file_key: string;
  mime: string;
  size: number;
  created_at: string;
}

interface VisitorFileRow extends RowDataPacket, VisitorFile {}

/** Metadata untuk aplikasi; isi berkas diunduh lewat GET /api/files/:id (wajib login & pemilik). */
export const toFile = (f: VisitorFile) => ({
  id: f.id,
  kind: f.kind,
  name: f.name,
  type: f.mime,
  size: f.size,
  url: `/api/files/${f.id}`,
  createdAt: iso(f.created_at),
});

export const insertFile = async (f: Omit<VisitorFile, 'created_at'>, db: Queryable = pool) => {
  await db.execute(
    'INSERT INTO visitor_files (id, visitor_id, kind, ref, name, file_key, mime, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [f.id, f.visitor_id, f.kind, f.ref, f.name, f.file_key, f.mime, f.size, new Date()],
  );
};

/** Berkas milik pengunjung untuk satu kode sewa / booking. */
export const listFiles = async (visitorId: number, ref: string) => {
  const [rows] = await pool.execute<VisitorFileRow[]>(
    'SELECT * FROM visitor_files WHERE visitor_id = ? AND ref = ? ORDER BY created_at, kind',
    [visitorId, ref],
  );
  return rows;
};

/** Berkas milik pengunjung; milik orang lain → null (dibalas 404, cegah IDOR). */
export const findVisitorFile = async (visitorId: number, id: string): Promise<VisitorFile | null> => {
  const [rows] = await pool.execute<VisitorFileRow[]>('SELECT * FROM visitor_files WHERE id = ? AND visitor_id = ? LIMIT 1', [id, visitorId]);
  return rows[0] ?? null;
};
