import pool, { Queryable } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { iso, shortDate } from '../lib/format';
import { likePattern, where } from '../lib/http';

export type PaymentStatus = 'Lunas' | 'Perlu verifikasi' | 'Menunggu bayar';

export interface Order {
  id: string;
  type: 'Tiket' | 'Sewa gedung';
  customer: string;
  event_id: string | null;
  rental_id: string | null;
  service: string;
  service_date: string;
  qty: number | null;
  amount: number;
  payment: PaymentStatus;
  method: string | null;
  proof_method: string | null;
  proof_file: string | null;
  proof_from: string | null;
  proof_submitted_at: string | null;
  note: string | null;
  created_at: string;
  paid_at: string | null;
  /** Nama pendek acara (hasil JOIN), hanya untuk pesanan tiket. */
  event_short?: string | null;
}

export interface OrderRow extends RowDataPacket, Order {}

const SELECT = `
  SELECT o.*, e.short AS event_short
  FROM orders o LEFT JOIN events e ON e.id = o.event_id`;

/** Kode tiket per lembar, mis. TK-0128-A, TK-0128-B. */
const ticketCodes = (o: Order) =>
  Array.from({ length: o.qty ?? 0 }, (_, i) => `TK-${o.id.slice(-4)}-${String.fromCharCode(65 + (i % 26))}`);

export const toOrder = (r: Order) => ({
  id: r.id,
  type: r.type,
  customer: r.customer,
  eventId: r.event_id ?? undefined,
  rentalId: r.rental_id ?? undefined,
  service: r.service,
  serviceShort: r.event_short ?? r.service,
  serviceDate: r.service_date,
  qty: r.qty ?? undefined,
  amount: r.amount,
  payment: r.payment,
  method: r.method ?? r.proof_method ?? undefined,
  proof: r.proof_file
    ? { method: r.proof_method, file: r.proof_file, from: r.proof_from, submittedAt: iso(r.proof_submitted_at) }
    : undefined,
  note: r.note ?? undefined,
  createdAt: iso(r.created_at),
  paidAt: iso(r.paid_at),
  ticket:
    r.type === 'Tiket'
      ? { status: r.payment === 'Lunas' ? 'Tiket aktif' : 'Belum terbit', codes: r.payment === 'Lunas' ? ticketCodes(r) : [] }
      : undefined,
});

/** Ringkasan teks pesanan, dipakai di pencarian. */
export const orderSummary = (o: Order) =>
  o.type === 'Tiket' ? `${o.customer} · ${o.qty} tiket ${o.service}` : `${o.customer} · Sewa ${shortDate(o.service_date)}`;

export const findOrderById = async (id: string, db: Queryable = pool): Promise<Order | null> => {
  const [rows] = await db.execute<OrderRow[]>(`${SELECT} WHERE o.id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
};

export const listOrders = async (q: { type?: string; payment?: string; q?: string; eventId?: string; limit: number }) => {
  const pattern = q.q ? likePattern(q.q) : '';
  const filter = where([
    q.type && ['o.type = ?', q.type],
    q.payment && ['o.payment = ?', q.payment],
    q.eventId && ['o.event_id = ?', q.eventId],
    q.q && ['(o.id LIKE ? OR o.customer LIKE ? OR o.service LIKE ?)', pattern, pattern, pattern],
  ]);
  const [rows] = await pool.execute<OrderRow[]>(`${SELECT} ${filter.sql} ORDER BY o.created_at DESC LIMIT ${q.limit}`, filter.params);
  return rows;
};

export const countOrdersForEvent = async (eventId: string) => {
  const [[row]] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS n FROM orders WHERE event_id = ?', [eventId]);
  return row.n as number;
};

/** Status bayar & nominal tagihan sewa (bila sudah dibuat). */
export const findRentalInvoice = async (rentalId: string) => {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT payment, amount FROM orders WHERE rental_id = ? LIMIT 1', [rentalId]);
  return (rows[0] as { payment: PaymentStatus; amount: number } | undefined) ?? null;
};

/** Tandai lunas. `method`/`note` kosong = pertahankan nilai yang ada. */
export const markOrderPaid = async (id: string, method: string | null, note: string | null, db: Queryable = pool) => {
  await db.execute(
    `UPDATE orders SET payment = 'Lunas', paid_at = ?, method = COALESCE(?, method, proof_method), note = COALESCE(?, note) WHERE id = ?`,
    [new Date(), method, note, id],
  );
};

/** Bukti tidak sesuai → kembali menunggu bayar, bukti lama dihapus. */
export const rejectOrderProof = async (id: string, note: string | null) => {
  await pool.execute(
    `UPDATE orders SET payment = 'Menunggu bayar', note = ?, proof_method = NULL, proof_file = NULL, proof_from = NULL, proof_submitted_at = NULL
     WHERE id = ?`,
    [note, id],
  );
};

/** Tagihan sewa dibuat setelah permintaan disetujui (id tagihan = id sewa). */
export const createRentalInvoice = async (
  r: { id: string; applicant: string; venue: string; date: string; amount: number },
  db: Queryable = pool,
) => {
  await db.execute(
    `INSERT IGNORE INTO orders (id, type, customer, rental_id, service, service_date, amount, payment, created_at)
     VALUES (?, 'Sewa gedung', ?, ?, ?, ?, ?, 'Menunggu bayar', ?)`,
    [r.id, r.applicant, r.id, r.venue, r.date, r.amount, new Date()],
  );
};

/** Antrean dashboard: bukti transfer yang menunggu verifikasi & tagihan yang belum dibayar. */
export const paymentQueues = async () => {
  const [[pending]] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS count, MIN(proof_submitted_at) AS oldest FROM orders WHERE payment = 'Perlu verifikasi'`,
  );
  const [[waiting]] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS count FROM orders WHERE payment = 'Menunggu bayar'`);
  return { pending: { count: pending.count as number, oldest: iso(pending.oldest as string | null) }, waiting: waiting.count as number };
};

export const searchOrders = async (pattern: string, limit: number) => {
  const [rows] = await pool.execute<OrderRow[]>(
    `SELECT * FROM orders WHERE id LIKE ? OR customer LIKE ? ORDER BY created_at DESC LIMIT ${limit}`,
    [pattern, pattern],
  );
  return rows;
};
