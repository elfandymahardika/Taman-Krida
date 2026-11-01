import prisma from '../../lib/prisma';
import usersSeeder from './001-seed-users';
import kvSeeder from './002-seed-kv';
import facilitiesSeeder from './003-seed-facilities';
import mediaSeeder from './004-seed-media';
import contentsSeeder from './005-seed-contents';
import eventsSeeder from './006-seed-events';
import rentalsSeeder from './007-seed-rentals';
import ordersSeeder from './008-seed-orders';
import communitiesSeeder from './009-seed-communities';
import financeSeeder from './010-seed-finance';
import feedSeeder from './011-seed-feed';
import notesSeeder from './012-seed-notes';
import documentsSeeder from './013-seed-documents';
import { Seeder } from './helpers';

// Urutan induk → anak (orders merujuk events & rentals).
const SEEDERS: Seeder[] = [
  usersSeeder,
  kvSeeder,
  facilitiesSeeder,
  mediaSeeder,
  contentsSeeder,
  eventsSeeder,
  rentalsSeeder,
  ordersSeeder,
  communitiesSeeder,
  financeSeeder,
  feedSeeder,
  notesSeeder,
  documentsSeeder,
];

/** Tabel dengan id auto-increment yang nomornya diulang dari 1 setelah dikosongkan. */
const AUTO_INCREMENT_TABLES = ['users', 'activity', 'notifications', 'notes'];

/**
 * Kosongkan tabel panel admin (urutan terbalik) lalu isi dengan data contoh lewat Prisma Client.
 * Aman dijalankan berulang: hasilnya selalu sama dengan data awal. Tabel visitor_* diisi seeder API mobile.
 */
export async function runSeeders() {
  for (const seeder of [...SEEDERS].reverse()) await seeder.down(prisma);
  for (const table of AUTO_INCREMENT_TABLES) await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
  for (const seeder of SEEDERS) await seeder.up(prisma);
}

if (require.main === module) {
  runSeeders()
    .then(() => console.log('Seeder berhasil dijalankan: database diisi dengan data contoh.'))
    .catch((error) => {
      console.error('Seeder gagal:', error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
