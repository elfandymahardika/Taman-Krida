import mysql from 'mysql2/promise';
import { dbCredentials } from '../lib/databaseUrl';
import { prismaCli } from './prisma';

/*
 * Migration memakai Prisma Migrate (folder prisma/migrations). Skema di prisma/schema.prisma mencakup
 * seluruh tabel database TKBJ, termasuk tabel visitor_* milik API aplikasi mobile.
 *
 *   npm run migrate        → terapkan migration yang belum dijalankan (prisma migrate deploy)
 *   npm run migrate:fresh  → kosongkan database lalu jalankan semua migration dari awal (prisma migrate reset)
 *   npm run prisma -- migrate dev --name <nama>   → buat migration baru setelah mengubah schema.prisma
 */

/** Migration pertama = struktur database saat beralih dari Sequelize ke Prisma. */
const BASELINE = '0_init';

/** Buat database bila belum ada, agar `npm run migrate` langsung jalan di MySQL yang masih kosong. */
async function withServer<T>(fn: (conn: mysql.Connection, database: string) => Promise<T>) {
  const { database, ...server } = dbCredentials();
  const conn = await mysql.createConnection(server);
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database.replace(/`/g, '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    return await fn(conn, database);
  } finally {
    await conn.end();
  }
}

/**
 * Database lama (dibuat migration Sequelize) sudah berisi tabel tapi belum punya `_prisma_migrations`.
 * Tandai 0_init sebagai sudah dijalankan (baseline) dan hapus tabel log Sequelize, agar data tidak hilang.
 */
async function baselineLegacyDatabase() {
  const legacy = await withServer(async (conn, database) => {
    const [rows] = await conn.query('SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ?', [database]);
    const tables = new Set((rows as { name: string }[]).map((r) => r.name));
    if (!tables.has('users') || tables.has('_prisma_migrations')) return false;
    await conn.query(`DROP TABLE IF EXISTS \`${database}\`.\`migrations\`, \`${database}\`.\`mobile_migrations\``);
    return true;
  });
  if (legacy) prismaCli(['migrate', 'resolve', '--applied', BASELINE], { quiet: true });
  return legacy;
}

/**
 * Khusus test otomatis: buat ulang database test (nama WAJIB berakhiran "_test") lalu jalankan semua
 * migration. Sengaja tidak memakai `prisma migrate reset`, dan menolak database selain database test,
 * supaya test tidak pernah mengosongkan database development/produksi.
 */
export async function recreateTestDatabase({ quiet = true } = {}) {
  const { database } = dbCredentials();
  if (!database.endsWith('_test')) throw new Error(`Menolak mengosongkan "${database}": hanya database berakhiran _test.`);
  await withServer(async (conn) => {
    await conn.query(`DROP DATABASE \`${database}\``);
    await conn.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  });
  prismaCli(['migrate', 'deploy'], { quiet });
}

/**
 * Jalankan migration yang belum dijalankan.
 * `fresh: true` (npm run migrate:fresh) menghapus SEMUA tabel lewat `prisma migrate reset` lalu membuat
 * ulang — Prisma meminta konfirmasi dan hanya untuk database development.
 */
export async function runMigrations({ fresh = false, quiet = false } = {}) {
  await withServer(async () => undefined);
  if (fresh) {
    prismaCli(['migrate', 'reset', '--skip-seed', '--skip-generate'], { quiet });
    return { baselined: false };
  }
  const baselined = await baselineLegacyDatabase();
  prismaCli(['migrate', 'deploy'], { quiet });
  return { baselined };
}

if (require.main === module) {
  const fresh = process.argv.includes('--fresh');
  runMigrations({ fresh })
    .then(({ baselined }) => {
      if (baselined) console.log('Database lama (Sequelize) ditandai sebagai migration 0_init — data tetap utuh.');
      console.log(fresh ? 'Database dikosongkan dan semua migration dijalankan ulang.' : 'Migration selesai.');
    })
    .catch((error) => {
      console.error('Migration gagal:', error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
