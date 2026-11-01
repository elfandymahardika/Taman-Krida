import type { RentalApproval } from '@prisma/client';
import { RENTALS } from './data';
import { day, en, Seeder, time } from './helpers';

/** Permintaan sewa gedung (sebagian sudah diputuskan). */
export default {
  async up(prisma) {
    await prisma.rental.createMany({
      data: RENTALS.map((r) => ({
        id: r.id,
        applicant: r.applicant,
        venue: r.venue,
        date: day(r.date),
        start_time: time(r.start),
        end_time: time(r.end),
        activity: r.activity,
        approval: en<RentalApproval>(r.approval),
        file: r.file,
        submitted_at: new Date(r.submittedAt),
        decided_at: r.approval === 'Perlu ditinjau' ? null : new Date(r.submittedAt),
      })),
    });
  },

  async down(prisma) {
    await prisma.rental.deleteMany();
  },
} satisfies Seeder;
