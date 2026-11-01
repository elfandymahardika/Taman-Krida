import { EVENTS, ORDERS } from './data';
import { day, en, Seeder } from './helpers';

const date = (v?: string) => (v ? new Date(v) : null);

/** Pesanan tiket & tagihan sewa. Nama layanan tiket diambil dari acaranya. */
export default {
  async up(prisma) {
    await prisma.order.createMany({
      data: ORDERS.map((o) => {
        const event = o.eventId ? EVENTS.find((e) => e.id === o.eventId) : undefined;
        return {
          id: o.id,
          type: en(o.type),
          customer: o.customer,
          event_id: o.eventId ?? null,
          rental_id: o.rentalId ?? null,
          service: event ? event.name : o.service!,
          service_date: day(event ? event.date : o.serviceDate!),
          qty: o.qty ?? null,
          amount: o.amount,
          payment: en(o.payment),
          method: o.method ?? null,
          proof_method: o.proofMethod ?? null,
          proof_file: o.proofFile ?? null,
          proof_from: o.proofFrom ?? null,
          proof_submitted_at: date(o.proofSubmittedAt),
          created_at: new Date(o.createdAt),
          paid_at: date(o.paidAt),
        };
      }),
    });
  },

  async down(prisma) {
    await prisma.order.deleteMany();
  },
} satisfies Seeder;
