import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/*
 * Skema & migration database dimiliki backend/admin-dashboard (satu database untuk dua backend).
 * API mobile hanya butuh Prisma Client, jadi file prisma/schema.prisma di sini adalah SALINAN skema
 * dashboard. `npm run prisma:sync` menyalin ulang skema lalu menjalankan `prisma generate`.
 * Jangan menjalankan `prisma migrate` dari folder ini.
 */

const ROOT = path.resolve(__dirname, '../..');
export const SOURCE = path.resolve(ROOT, '../admin-dashboard/prisma/schema.prisma');
export const COPY = path.resolve(ROOT, 'prisma/schema.prisma');

const HEADER =
  '// SALINAN OTOMATIS dari backend/admin-dashboard/prisma/schema.prisma — jangan diubah di sini.\n' +
  '// Ubah skema di backend dashboard, buat migration di sana, lalu jalankan `npm run prisma:sync` di folder ini.\n\n';

/** Isi skema dashboard dengan header salinan (dipakai juga test untuk memastikan salinan tidak usang). */
export const expectedCopy = () => HEADER + fs.readFileSync(SOURCE, 'utf8');

export function syncSchema() {
  fs.mkdirSync(path.dirname(COPY), { recursive: true });
  fs.writeFileSync(COPY, expectedCopy());
  const cli = require.resolve('prisma/build/index.js', { paths: [ROOT] });
  const result = spawnSync(process.execPath, [cli, 'generate'], { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) throw new Error('prisma generate gagal.');
}

if (require.main === module) {
  try {
    syncSchema();
    console.log('Skema Prisma disalin dari backend dashboard dan Prisma Client dibuat.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
