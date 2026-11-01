import { randomInt, randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { transaction } from '../config/db';
import { config } from '../config/env';
import { PAYMENT_LABELS } from '../lib/catalog';
import { hhmm, iso, rupiah } from '../lib/format';
import { badRequest, conflict, FieldErrors, notFound, retryOnDuplicate } from '../lib/http';
import { fileLabel, originalName, removeFiles, saveFile } from '../lib/storage';
import { getSettings, logActivity, maxTickets, notifyAdmin, payDeadlineHours } from '../models/adminModel';
import { findPublishedEvent, isTicketed, remainingOf } from '../models/eventModel';
import { insertFile, listFiles, toFile } from '../models/fileModel';
import { insertNotification } from '../models/notificationModel';
import {
  bookingCodeTaken,
  insertTicketOrder,
  lastTicketNumber,
  linkVisitorOrder,
  listBookingOrders,
  listVisitorOrders,
  PaymentStatus,
  setOrdersNotified,
  submitPaymentProof,
  ticketCodes,
  VisitorOrder,
} from '../models/orderModel';

/** Status satu booking dari status tiap pesanannya: ada yang belum dibayar → belum dibayar, dst. */
const bookingPayment = (orders: VisitorOrder[]): PaymentStatus =>
  orders.some((o) => o.payment === 'Menunggu bayar') ? 'Menunggu bayar' : orders.some((o) => o.payment === 'Perlu verifikasi') ? 'Perlu verifikasi' : 'Lunas';

/** Satu kode booking (beberapa baris `orders`) → JSON untuk Tiket Saya / E-Tiket. */
function toBooking(orders: VisitorOrder[], holdHours: number) {
  const first = orders[0];
  const payment = bookingPayment(orders);
  const createdAt = iso(first.created_at);
  return {
    code: first.booking_code,
    buyer: { name: first.customer, email: first.buyer_email, phone: first.buyer_phone },
    payment,
    paymentLabel: PAYMENT_LABELS[payment],
    method: orders.find((o) => o.method)?.method ?? orders.find((o) => o.proof_method)?.proof_method ?? undefined,
    total: orders.reduce((sum, o) => sum + o.amount, 0),
    createdAt,
    payBefore: payment === 'Lunas' ? undefined : new Date(Date.parse(createdAt) + holdHours * 3600e3).toISOString(),
    paidAt: payment === 'Lunas' ? iso(orders.map((o) => o.paid_at ?? '').sort().at(-1) || null) : undefined,
    lines: orders.map((o) => ({
      orderId: o.id,
      eventId: o.event_id ?? undefined,
      event: o.service,
      eventShort: o.event_short ?? o.service,
      date: o.service_date,
      start: o.event_start ? hhmm(o.event_start) : undefined,
      end: o.event_end ? hhmm(o.event_end) : undefined,
      venue: o.event_venue ?? undefined,
      photo: o.event_photo ?? undefined,
      qty: o.qty ?? 0,
      price: o.qty ? Math.round(o.amount / o.qty) : o.amount,
      subtotal: o.amount,
      payment: o.payment,
      paymentLabel: PAYMENT_LABELS[o.payment],
      /** Catatan admin, mis. alasan bukti transfer ditolak. */
      note: o.note ?? undefined,
      ticketCodes: o.payment === 'Lunas' ? ticketCodes(o) : [],
    })),
  };
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Kode booking acak, mis. TKBJ-7KQ2MD (tanpa huruf/angka yang mirip seperti O/0, I/1). */
async function newBookingCode() {
  for (;;) {
    const code = `TKBJ-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')}`;
    if (!(await bookingCodeTaken(code))) return code;
  }
}

/** "MMYY" bulan berjalan (WIB) untuk nomor pesanan, mis. TK-1026-0129. */
const monthPrefix = () => {
  const wib = new Date(Date.now() + 7 * 3600e3).toISOString();
  return `${wib.slice(5, 7)}${wib.slice(2, 4)}`;
};

async function mustFindBooking(visitorId: number, code: string) {
  const orders = await listBookingOrders(visitorId, code);
  if (!orders.length) throw notFound('Pesanan tiket');
  return orders;
}

/**
 * Checkout keranjang: satu pesanan (baris `orders`, status "Menunggu bayar") per acara, dikelompokkan dalam satu kode booking.
 * Baris acara dikunci selama transaksi agar dua checkout bersamaan tidak melampaui kuota.
 */
export const checkout = async (req: Request, res: Response) => {
  const visitor = res.locals.visitor;
  const items: { eventId: string; qty: number }[] = req.body.items;
  const buyer = req.body.buyer ?? { name: visitor.name, email: visitor.email, phone: visitor.phone };
  const settings = await getSettings();
  const [limit, holdHours] = [maxTickets(settings), payDeadlineHours(settings)];
  const code = await newBookingCode();

  const created = await retryOnDuplicate(() =>
    transaction(async (conn) => {
      const errors: FieldErrors = {};
      const events = [];
      for (const [i, item] of items.entries()) {
        const event = await findPublishedEvent(item.eventId, holdHours, conn, true);
        const field = `items.${i}`;
        if (!event) errors[`${field}.eventId`] = 'Acara tidak ditemukan atau belum dipublikasikan.';
        else if (!isTicketed(event)) errors[`${field}.eventId`] = `${event.name} tidak memerlukan tiket.`;
        else if (event.date < config.today) errors[`${field}.eventId`] = `${event.name} sudah berlangsung.`;
        else if (item.qty > limit) errors[`${field}.qty`] = `Maksimal ${limit} tiket per acara.`;
        else if (item.qty > remainingOf(event)!) errors[`${field}.qty`] = `Kuota ${event.name} tidak cukup: tersisa ${remainingOf(event)} tiket.`;
        events.push(event!);
      }
      if (Object.keys(errors).length) throw badRequest('Pesanan tidak dapat diproses.', errors);

      let number = await lastTicketNumber(conn);
      const ids: string[] = [];
      for (const [i, item] of items.entries()) {
        const event = events[i];
        const id = `TK-${monthPrefix()}-${String(++number).padStart(4, '0')}`;
        await insertTicketOrder(
          { id, customer: buyer.name, eventId: event.id, service: event.name, serviceDate: event.date, qty: item.qty, amount: event.price! * item.qty },
          conn,
        );
        await linkVisitorOrder({ orderId: id, visitorId: visitor.id, bookingCode: code, email: buyer.email, phone: buyer.phone }, conn);
        ids.push(id);
      }
      await logActivity('payment', 'Pesanan tiket dari aplikasi', `${buyer.name} · ${ids.join(', ')}`, conn);
      await insertNotification(
        visitor.id,
        {
          symbol: '⏰',
          title: 'Selesaikan pembayaran tiket',
          body: `Pesanan ${code} menunggu pembayaran. Unggah bukti transfer dalam ${holdHours} jam agar kursi tidak dilepas.`,
          target: 'tickets',
          targetId: code,
        },
        conn,
      );
      return ids;
    }),
  );

  const orders = await listBookingOrders(visitor.id, code);
  res.status(201).json({ ...toBooking(orders, holdHours), orderIds: created });
};

/** Tiket Saya: semua booking milik pengunjung, terbaru dulu. */
export const getBookings = async (_req: Request, res: Response) => {
  const holdHours = payDeadlineHours(await getSettings());
  const groups = new Map<string, VisitorOrder[]>();
  for (const o of await listVisitorOrders(res.locals.userId)) groups.set(o.booking_code, [...(groups.get(o.booking_code) ?? []), o]);
  res.json([...groups.values()].map((orders) => toBooking(orders, holdHours)));
};

/** Detail booking / E-Tiket + berkas bukti transfer yang pernah diunggah. Booking milik orang lain → 404. */
export const getBooking = async (req: Request<{ code: string }>, res: Response) => {
  const orders = await mustFindBooking(res.locals.userId, req.params.code);
  const holdHours = payDeadlineHours(await getSettings());
  res.json({ ...toBooking(orders, holdHours), proofs: (await listFiles(res.locals.userId, req.params.code)).map(toFile) });
};

/**
 * Unggah bukti pembayaran booking (multipart: file, method, sender) → semua pesanan yang belum dibayar menjadi
 * "Perlu verifikasi" di menu Transaksi dashboard. Admin Keuangan yang menyatakan lunas (e-tiket terbit).
 */
export const payBooking = async (req: Request<{ code: string }>, res: Response) => {
  const visitor = res.locals.visitor;
  const orders = await mustFindBooking(visitor.id, req.params.code);
  const unpaid = orders.filter((o) => o.payment === 'Menunggu bayar');
  if (!unpaid.length)
    throw conflict(bookingPayment(orders) === 'Lunas' ? 'Pesanan ini sudah lunas.' : 'Bukti transfer sedang diverifikasi admin.');

  const file = req.file!;
  const ids = unpaid.map((o) => o.id);
  const key = await saveFile(file);
  try {
    await transaction(async (conn) => {
      const changed = await submitPaymentProof(ids, { method: req.body.method, file: fileLabel(file), from: `a.n. ${req.body.sender || visitor.name}` }, conn);
      if (changed !== ids.length) throw conflict('Status pesanan baru saja berubah. Muat ulang lalu coba lagi.');
      await insertFile(
        { id: randomUUID(), visitor_id: visitor.id, kind: 'bukti', ref: req.params.code, name: originalName(file), file_key: key, mime: file.mimetype, size: file.size },
        conn,
      );
      await setOrdersNotified(ids, 'Perlu verifikasi', conn);
      const total = unpaid.reduce((sum, o) => sum + o.amount, 0);
      await logActivity('payment', 'Bukti transfer diunggah', `${unpaid[0].customer} · ${ids.join(', ')}`, conn);
      await notifyAdmin(`Bukti transfer ${ids.join(', ')} menunggu verifikasi (${rupiah(total)})`, '/transaksi', 'payment', conn);
    });
  } catch (error) {
    // Rollback anti-file yatim: berkas dihapus bila data gagal disimpan.
    await removeFiles([key]);
    throw error;
  }
  const holdHours = payDeadlineHours(await getSettings());
  res.json({
    ...toBooking(await listBookingOrders(visitor.id, req.params.code), holdHours),
    proofs: (await listFiles(visitor.id, req.params.code)).map(toFile),
  });
};
