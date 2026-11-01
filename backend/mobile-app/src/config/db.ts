import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Mengatur connection pool ke database MySQL. Dipakai semua model (query SQL murni).
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tkbj_admin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Waktu disimpan dalam UTC. DATE/DATETIME dikembalikan sebagai teks (mis. "2026-10-02"),
  // agar tidak bergeser zona waktu; model mengubah DATETIME ke format ISO.
  timezone: 'Z',
  dateStrings: true,
  // SUM()/DECIMAL dikembalikan sebagai number, bukan string.
  decimalNumbers: true,
  charset: 'utf8mb4',
});

/** Pool atau satu koneksi di dalam transaksi; fungsi model menerima keduanya. */
export type Queryable = mysql.Pool | mysql.PoolConnection;

/** Jalankan beberapa query sebagai satu transaksi: COMMIT bila berhasil, ROLLBACK bila ada error. */
export async function transaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export default pool;
