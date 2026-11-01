import dotenv from 'dotenv';

dotenv.config({ quiet: true });

/** Kredensial MySQL dari .env (sama dengan pool mysql2 di config/db.ts). */
export const dbCredentials = () => ({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tkbj_admin',
});

/**
 * URL koneksi Prisma ("mysql://user:pass@host:port/db"), disusun dari DB_* agar .env cukup diisi
 * sekali. DATABASE_URL di .env (bila ada) tetap diutamakan, mis. untuk database hosting.
 */
export function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const c = dbCredentials();
  const auth = c.password ? `${encodeURIComponent(c.user)}:${encodeURIComponent(c.password)}` : encodeURIComponent(c.user);
  return `mysql://${auth}@${c.host}:${c.port}/${encodeURIComponent(c.database)}`;
}
