import { Request, Response } from 'express';
import { transaction } from '../config/db';
import { logActivity, notify } from '../lib/activity';
import { rupiah } from '../lib/format';
import { assertValid, conflict, FieldErrors, HttpError, notFound, queryText } from '../lib/http';
import { canView } from '../lib/roles';
import { User } from '../models/userModel';
import { addTicketsSold, findEventById } from '../models/eventModel';
import { addMonthlySales } from '../models/financeModel';
import { findOrderById, listOrders, markOrderPaid, Order, rejectOrderProof, toOrder } from '../models/orderModel';

export const PAYMENT_METHODS = ['Transfer bank', 'QRIS', 'Tunai di loket'];

/** Bulan pembukuan (WIB) dari waktu ISO / DATETIME UTC. */
const ledgerMonth = (utc: string) => new Date(Date.parse(`${utc.replace(' ', 'T')}Z`) + 7 * 3600e3).toISOString().slice(0, 7);

/**
 * Tandai pesanan lunas dalam satu transaksi: menambah tiket terjual (untuk tiket),
 * memasukkan nominal ke rekap penjualan bulanan, lalu mencatat aktivitas & notifikasi.
 */
async function markPaid(order: Order, user: User, { method, note }: { method?: string; note?: string } = {}) {
  await transaction(async (conn) => {
    if (order.type === 'Tiket' && order.event_id) {
      const event = await findEventById(order.event_id, conn);
      const qty = order.qty ?? 0;
      if (event?.quota != null && (event.sold ?? 0) + qty > event.quota)
        throw conflict(`Kuota ${event.name} tidak cukup: tersisa ${event.quota - (event.sold ?? 0)} tiket.`);
      if (event) await addTicketsSold(event.id, qty, conn);
    }
    await markOrderPaid(order.id, method ?? null, note || null, conn);
    await addMonthlySales(ledgerMonth(order.created_at), order.type === 'Tiket' ? 'ticket' : 'rental', order.amount / 1e6, conn);

    const kind = order.type === 'Tiket' ? 'tiket' : 'sewa';
    await logActivity('payment', `Pembayaran ${kind} dikonfirmasi`, `${user.name} · ${order.id}`, conn);
    await notify(`Pembayaran ${order.id} dikonfirmasi (${rupiah(order.amount)})`, '/transaksi', 'payment', conn);
  });
}

async function mustFind(id: string) {
  const order = await findOrderById(id);
  if (!order) throw notFound('Transaksi');
  return order;
}

const listFromQuery = (query: Request['query'], limit?: number) =>
  listOrders({
    type: queryText(query.type),
    payment: queryText(query.payment),
    q: queryText(query.q),
    eventId: queryText(query.eventId),
    limit: limit ?? Math.min(Math.max(Number(query.limit) || 100, 1), 500),
  });

/** Daftar pesanan: modul Transaksi, atau pesanan tiket saja bagi peran yang boleh melihat Acara & tiket. */
export const getOrders = async (req: Request, res: Response) => {
  const role = res.locals.user.role_key;
  if (!canView(role, 'payments') && !(req.query.type === 'Tiket' && canView(role, 'events')))
    throw new HttpError(403, 'Peran Anda tidak memiliki akses ke modul Transaksi.');
  res.json((await listFromQuery(req.query)).map(toOrder));
};

export const exportOrdersCsv = async (req: Request, res: Response) => {
  const header = ['ID', 'Jenis', 'Pemesan', 'Layanan', 'Tanggal layanan', 'Jumlah tiket', 'Nominal (Rp)', 'Pembayaran', 'Metode', 'Dibuat', 'Dibayar'];
  const cell = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const lines = (await listFromQuery(req.query, 500)).map((o) => {
    const r = toOrder(o);
    return [r.id, r.type, r.customer, r.service, r.serviceDate, r.qty, r.amount, r.payment, r.method, r.createdAt, r.paidAt].map(cell).join(',');
  });
  res
    .type('text/csv; charset=utf-8')
    .attachment(`transaksi-tkbj-${new Date().toISOString().slice(0, 10)}.csv`)
    .send(`﻿${[header.map(cell).join(','), ...lines].join('\r\n')}`);
};

export const getOrder = async (req: Request<{ id: string }>, res: Response) => {
  res.json(toOrder(await mustFind(req.params.id)));
};

/** Verifikasi bukti transfer → lunas. */
export const verifyOrder = async (req: Request<{ id: string }>, res: Response) => {
  const order = await mustFind(req.params.id);
  if (order.payment !== 'Perlu verifikasi')
    throw conflict(order.payment === 'Lunas' ? 'Pembayaran ini sudah lunas.' : 'Belum ada bukti transfer untuk diverifikasi.');
  await markPaid(order, res.locals.user, { note: req.body?.note });
  res.json(toOrder((await findOrderById(order.id))!));
};

/** Bukti tidak sesuai → minta pemesan mengunggah ulang. */
export const rejectOrder = async (req: Request<{ id: string }>, res: Response) => {
  const order = await mustFind(req.params.id);
  if (order.payment !== 'Perlu verifikasi') throw conflict('Hanya pembayaran yang menunggu verifikasi yang bisa diminta ulang.');
  await rejectOrderProof(order.id, req.body?.note || null);
  await logActivity('payment', 'Bukti transfer diminta ulang', `${res.locals.user.name} · ${order.id}`);
  res.json(toOrder((await findOrderById(order.id))!));
};

/** Catat pembayaran manual (mis. tunai di loket) untuk tagihan yang belum lunas. */
export const recordPayment = async (req: Request<{ id: string }>, res: Response) => {
  const order = await findOrderById(req.params.id);
  const body = req.body ?? {};
  const amount = Number(body.amount);
  const errors: FieldErrors = {};
  if (!order) errors.nomor = 'Nomor transaksi tidak ditemukan.';
  else if (order.payment === 'Lunas') errors.nomor = 'Transaksi ini sudah lunas.';
  if (!Number.isFinite(amount) || amount <= 0) errors.nominal = 'Nominal harus lebih dari 0.';
  else if (order && amount !== order.amount) errors.nominal = `Nominal harus sama dengan tagihan (${rupiah(order.amount)}).`;
  if (body.method !== undefined && !PAYMENT_METHODS.includes(body.method)) errors.metode = 'Metode pembayaran tidak dikenal.';
  assertValid(errors);
  await markPaid(order!, res.locals.user, { method: body.method, note: body.note });
  res.json(toOrder((await findOrderById(order!.id))!));
};
