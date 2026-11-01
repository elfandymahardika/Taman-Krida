import type { EventStatus } from '@prisma/client';
import { EVENTS } from './data';
import { day, en, Seeder, time } from './helpers';

/** Agenda September–Oktober 2026. Acara tanpa `quota` = tanpa tiket. */
export default {
  async up(prisma) {
    const at = new Date('2026-09-01T00:00:00.000Z');
    await prisma.event.createMany({
      data: EVENTS.map((e) => ({
        id: e.id,
        name: e.name,
        short: e.short ?? e.name,
        organizer: e.organizer,
        date: day(e.date),
        start_time: time(e.start),
        end_time: time(e.end),
        venue: e.venue,
        status: en<EventStatus>(e.status),
        quota: e.quota ?? null,
        sold: e.sold ?? (e.quota != null ? 0 : null),
        price: e.price ?? null,
        photo: e.photo ?? null,
        created_at: at,
        updated_at: at,
      })),
    });
  },

  async down(prisma) {
    await prisma.event.deleteMany();
  },
} satisfies Seeder;
