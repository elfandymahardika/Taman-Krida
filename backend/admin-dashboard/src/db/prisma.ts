import { spawnSync } from 'child_process';
import path from 'path';
import { databaseUrl } from '../lib/databaseUrl';

const ROOT = path.resolve(__dirname, '../..');
const CLI = require.resolve('prisma/build/index.js', { paths: [ROOT] });

/**
 * Jalankan Prisma CLI dengan DATABASE_URL yang disusun dari DB_* di .env.
 * Contoh: `npm run prisma -- migrate dev --name tambah_kolom` atau `npm run prisma -- studio`.
 * `quiet` = tangkap keluaran (untuk test); bila gagal, keluarannya ikut di pesan error.
 */
export function prismaCli(args: string[], { quiet = false } = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl(), PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    stdio: quiet ? 'pipe' : 'inherit',
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`prisma ${args.join(' ')} gagal${quiet ? `:\n${result.stdout}\n${result.stderr}` : '.'}`);
  }
  return result.stdout ?? '';
}

if (require.main === module) {
  try {
    prismaCli(process.argv.slice(2));
  } catch {
    process.exit(1);
  }
}
