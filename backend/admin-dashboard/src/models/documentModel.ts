import crypto from 'crypto';
import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { iso } from '../lib/format';

/*
 * Data Access Layer dokumen (Modul 03): query SQL murni tabel documents.
 * Hanya metadata yang disimpan; file fisiknya dikelola services/storage.service.ts.
 */

export interface DocumentRecord {
  id: string;
  name: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  url: string;
  userId: number;
  owner?: string;
  createdAt: string;
}

interface DocumentRow extends RowDataPacket {
  id: string;
  name: string;
  file_key: string;
  file_type: string;
  file_size: number;
  url: string;
  user_id: number;
  owner_name?: string;
  created_at: string;
}

const SELECT = 'SELECT d.*, u.name AS owner_name FROM documents d JOIN users u ON u.id = d.user_id';

const toRecord = (r: DocumentRow): DocumentRecord => ({
  id: r.id,
  name: r.name,
  fileKey: r.file_key,
  fileType: r.file_type,
  fileSize: r.file_size,
  url: r.url,
  userId: r.user_id,
  owner: r.owner_name,
  createdAt: iso(r.created_at),
});

/** Bentuk JSON untuk klien: tanpa fileKey (detail internal storage). */
export const toDocument = ({ fileKey: _fileKey, ...doc }: DocumentRecord) => doc;

export async function createDocument(data: {
  name: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  url: string;
  userId: number;
}): Promise<DocumentRecord> {
  const id = crypto.randomUUID();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO documents (id, name, file_key, file_type, file_size, url, user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.fileKey, data.fileType, data.fileSize, data.url, data.userId, new Date()],
  );
  return (await getDocumentById(id))!;
}

export async function getDocumentById(id: string): Promise<DocumentRecord | null> {
  const [rows] = await pool.execute<DocumentRow[]>(`${SELECT} WHERE d.id = ? LIMIT 1`, [id]);
  return rows[0] ? toRecord(rows[0]) : null;
}

/** Dokumen milik satu user. */
export async function getDocumentsByUserId(userId: number) {
  const [rows] = await pool.execute<DocumentRow[]>(`${SELECT} WHERE d.user_id = ? ORDER BY d.created_at DESC`, [userId]);
  return rows.map(toRecord);
}

/** Semua dokumen (Administrator utama). */
export async function getAllDocuments() {
  const [rows] = await pool.execute<DocumentRow[]>(`${SELECT} ORDER BY d.created_at DESC`);
  return rows.map(toRecord);
}

export async function deleteDocumentFromDb(id: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>('DELETE FROM documents WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
