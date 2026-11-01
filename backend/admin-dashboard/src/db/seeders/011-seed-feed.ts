import { ACTIVITY, NOTIFICATIONS } from './data';
import { en, Seeder } from './helpers';

/** Log aktivitas & notifikasi awal dashboard. */
export default {
  async up(prisma) {
    await prisma.activity.createMany({
      data: ACTIVITY.map((a) => ({ kind: en(a.kind), title: a.title, sub: a.sub, created_at: new Date(a.createdAt) })),
    });
    await prisma.notification.createMany({
      data: NOTIFICATIONS.map((n) => ({ message: n.message, link: n.link, created_at: new Date(n.createdAt) })),
    });
  },

  async down(prisma) {
    await prisma.notification.deleteMany();
    await prisma.activity.deleteMany();
  },
} satisfies Seeder;
