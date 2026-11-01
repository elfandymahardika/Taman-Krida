import prisma from '../../lib/prisma';
import { removeFiles } from '../../lib/storage';
import visitorsSeeder from './001-seed-visitors';
import visitorLinksSeeder from './002-seed-visitor-links';

// Urutan induk → anak (tautan & notifikasi merujuk visitors).
const SEEDERS = [visitorsSeeder, visitorLinksSeeder];

/** Tabel dengan id auto-increment yang nomornya diulang dari 1 setelah dikosongkan. */
const AUTO_INCREMENT_TABLES = ['visitors', 'visitor_notifications'];

/**
 * Kosongkan tabel visitor_* (urutan terbalik) lalu isi dengan data contoh lewat Prisma Client. Tabel dashboard
 * tidak disentuh; jalankan `npm run seed` di backend/admin-dashboard lebih dulu bila ingin mengembalikan datanya.
 * Berkas unggahan pengunjung (folder lokal atau Vercel Blob) ikut dihapus agar tidak ada file yatim.
 */
export async function runSeeders() {
  const files = await prisma.visitorFile.findMany({ select: { file_key: true } });
  await removeFiles(files.map((f) => f.file_key));
  for (const seeder of [...SEEDERS].reverse()) await seeder.down(prisma);
  for (const table of AUTO_INCREMENT_TABLES) await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
  for (const seeder of SEEDERS) await seeder.up(prisma);
}

if (require.main === module) {
  runSeeders()
    .then(() => console.log('Seeder berhasil dijalankan: akun pengunjung demo dan tautannya ke data dashboard dibuat.'))
    .catch((error) => {
      console.error('Seeder gagal:', error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
