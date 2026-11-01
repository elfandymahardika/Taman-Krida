import { COMMUNITIES } from './data';
import { en, Seeder } from './helpers';

/** Direktori komunitas seni, dua di antaranya menunggu persetujuan. */
export default {
  async up(prisma) {
    await prisma.community.createMany({
      data: COMMUNITIES.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        city: c.city,
        members: c.members,
        contact: c.contact,
        photo: c.photo ?? null,
        status: en(c.status),
        leader: c.leader ?? null,
        since: c.since ?? null,
        applied_at: c.appliedAt ? new Date(c.appliedAt) : null,
      })),
    });
  },

  async down(prisma) {
    await prisma.community.deleteMany();
  },
} satisfies Seeder;
