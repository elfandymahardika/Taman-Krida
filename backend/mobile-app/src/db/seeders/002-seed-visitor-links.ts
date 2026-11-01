import type { PrismaClient } from '@prisma/client';
import { Approval, PaymentStatus, rentalNoticeKey } from '../../lib/catalog';
import { toDbEnum } from '../../lib/prisma';
import { NOTIFICATIONS, VISITOR_COMMUNITIES, VISITOR_ORDERS, VISITOR_RENTALS, VISITORS } from './data';

/**
 * Tautkan data contoh dashboard ke akun demo. Baris yang tidak ada di dashboard (mis. sudah dihapus admin) dilewati.
 * `notified_status` diisi status saat ini, sehingga notifikasi baru hanya muncul bila admin mengubahnya setelah seed.
 */
export default {
  async up(prisma: PrismaClient) {
    const visitors = await prisma.visitor.findMany({ select: { id: true, email: true } });
    const idOf = (key: string) => visitors.find((v) => v.email === VISITORS.find((x) => x.key === key)!.email)!.id;

    for (const o of VISITOR_ORDERS) {
      const order = await prisma.order.findUnique({ where: { id: o.orderId }, select: { payment: true } });
      if (!order) continue;
      await prisma.visitorOrder.create({
        data: {
          order_id: o.orderId,
          visitor_id: idOf(o.visitor),
          booking_code: o.bookingCode,
          buyer_email: o.email,
          buyer_phone: o.phone,
          notified_status: toDbEnum(order.payment),
          created_at: new Date(o.createdAt),
        },
      });
    }

    for (const r of VISITOR_RENTALS) {
      const rental = await prisma.rental.findUnique({
        where: { id: r.rentalId },
        select: { approval: true, orders: { select: { payment: true }, take: 1 } },
      });
      if (!rental) continue;
      const state = {
        approval: toDbEnum(rental.approval) as Approval,
        invoice_payment: rental.orders[0] ? (toDbEnum(rental.orders[0].payment) as PaymentStatus) : null,
      };
      await prisma.visitorRental.create({
        data: { rental_id: r.rentalId, visitor_id: idOf(r.visitor), contact: r.contact, notified_status: rentalNoticeKey(state), created_at: new Date(r.createdAt) },
      });
    }

    for (const c of VISITOR_COMMUNITIES) {
      const community = await prisma.community.findUnique({ where: { id: c.communityId }, select: { status: true } });
      if (!community) continue;
      await prisma.visitorCommunity.create({
        data: {
          community_id: c.communityId,
          visitor_id: idOf(c.visitor),
          address: c.address,
          description: c.description,
          notified_status: toDbEnum(community.status),
          created_at: new Date(c.createdAt),
        },
      });
    }

    await prisma.visitorNotification.createMany({
      data: NOTIFICATIONS.map((n) => ({
        visitor_id: idOf(n.visitor),
        symbol: n.symbol,
        title: n.title,
        body: n.body,
        target: n.target as 'rental' | 'event' | 'tickets' | 'communities' | 'calendar',
        target_id: n.targetId,
        created_at: new Date(n.createdAt),
        read_at: n.read ? new Date(n.createdAt) : null,
      })),
    });
  },

  async down(prisma: PrismaClient) {
    await prisma.visitorNotification.deleteMany();
    await prisma.visitorFile.deleteMany();
    await prisma.visitorCommunity.deleteMany();
    await prisma.visitorRental.deleteMany();
    await prisma.visitorOrder.deleteMany();
  },
};
