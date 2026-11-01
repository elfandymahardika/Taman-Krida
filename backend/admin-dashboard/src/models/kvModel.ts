import pool, { Queryable } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { iso } from '../lib/format';
import { DEFAULT_SETTINGS, Settings } from '../lib/settings';

interface KvRow extends RowDataPacket {
  name: string;
  value: string;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Baca data tunggal (profil lembaga / pengaturan) dari tabel kv. Nilai disimpan sebagai JSON.
 */
export const readKv = async <T = unknown>(name: string, db: Queryable = pool) => {
  const [rows] = await db.execute<KvRow[]>('SELECT * FROM kv WHERE name = ? LIMIT 1', [name]);
  const row = rows[0];
  return row ? { value: JSON.parse(row.value) as T, updatedAt: iso(row.updated_at), updatedBy: row.updated_by ?? undefined } : null;
};

export const writeKv = async (name: string, value: unknown, by: string | null = null, db: Queryable = pool) => {
  await db.execute(
    `INSERT INTO kv (name, value, updated_at, updated_by) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = VALUES(updated_at), updated_by = VALUES(updated_by)`,
    [name, JSON.stringify(value), new Date(), by],
  );
};

/** Pengaturan panel yang berlaku (bawaan + yang sudah disimpan admin). */
export const getSettings = async (db: Queryable = pool): Promise<Settings> => ({
  ...DEFAULT_SETTINGS,
  ...((await readKv<Partial<Settings>>('settings', db))?.value ?? {}),
});
