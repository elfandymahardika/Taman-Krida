import { CONTENTS } from './data';
import { day, en, Seeder } from './helpers';

/** Konten aplikasi publik, termasuk satu banner beranda. */
export default {
  async up(prisma) {
    await prisma.content.createMany({
      data: CONTENTS.map((c) => ({
        id: c.id,
        title: c.title,
        type: en(c.type),
        author: c.author,
        status: en(c.status),
        body: c.body ?? null,
        cta: c.cta ?? null,
        link: c.link ?? null,
        publish_from: c.from ? day(c.from) : null,
        publish_to: c.to ? day(c.to) : null,
        is_hero: Boolean(c.hero),
        updated_at: new Date(c.updatedAt),
      })),
    });
  },

  async down(prisma) {
    await prisma.content.deleteMany();
  },
} satisfies Seeder;
