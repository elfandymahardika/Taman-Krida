import { FINANCE } from './data';
import { Seeder } from './helpers';

/** Rekap keuangan Januari–Oktober 2026 (juta rupiah). */
export default {
  async up(prisma) {
    await prisma.financeMonthly.createMany({
      data: FINANCE.map((f) => ({
        month: f.month,
        sales_ticket: f.ticket,
        sales_rental: f.rental,
        p_stage: f.purchases[0],
        p_artist: f.purchases[1],
        p_maintenance: f.purchases[2],
        p_promo: f.purchases[3],
      })),
    });
  },

  async down(prisma) {
    await prisma.financeMonthly.deleteMany();
  },
} satisfies Seeder;
