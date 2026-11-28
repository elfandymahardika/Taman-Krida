import { FACILITIES, RENTAL_RATES } from './data';
import { Seeder } from './helpers';

/** Area/fasilitas TKBJ. Tiga area pertama dipakai sebagai lokasi acara & sewa. */
export default {
  async up(prisma) {
    await prisma.facility.createMany({
      data: FACILITIES.map((f, i) => ({
        id: f.id,
        name: f.name,
        capacity: f.capacity,
        purpose: f.purpose,
        photo: f.photo,
        bookable: f.bookable,
        sort: i,
      })),
    });
    // SQL mentah: kolom tarif tidak bergantung pada Prisma Client yang sudah digenerate ulang.
    for (const [name, rate] of Object.entries(RENTAL_RATES))
      await prisma.$executeRawUnsafe('UPDATE facilities SET rental_rate = ? WHERE name = ?', rate, name);
  },

  async down(prisma) {
    await prisma.facility.deleteMany();
  },
} satisfies Seeder;
