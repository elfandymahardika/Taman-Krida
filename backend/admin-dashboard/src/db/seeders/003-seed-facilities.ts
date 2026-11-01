import { FACILITIES } from './data';
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
  },

  async down(prisma) {
    await prisma.facility.deleteMany();
  },
} satisfies Seeder;
