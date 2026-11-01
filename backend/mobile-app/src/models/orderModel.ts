import pool, { Queryable } from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { PaymentStatus } from '../lib/catalog';

export type { PaymentStatus };

/** Baris `orders` (milik dashboard) + data pemilik dari `visitor_orders` + info acara. */
export interface VisitorOrder {
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
  proof_submitted_at: string | null;
  note: string | null;
  created_at: string;
  paid_at: string | null;
  booking_code: string;
  buyer_email: string;
  buyer_phone: string;
  notified_status: string;
  event_short: string | null;
  event_start: string | null;
  event_end: string | null;
  event_venue: string | null;
  event_photo: string | null;
}

interface VisitorOrderRow extends RowDataPacket, VisitorOrder {}

const SELECT = `
  SELECT o.*, vo.booking_code, vo.buyer_email, vo.buyer_phone, vo.notified_status,
         e.short AS event_short, e.start_time AS event_start, e.end_time AS event_end, e.venue AS event_venue, e.photo AS event_photo
  FROM visitor_orders vo
  JOIN orders o ON o.id = vo.order_id
  LEFT JOIN events e ON e.id = o.event_id`;

/** Kode tiket per lembar, sama dengan dashboard: TK-0128-A, TK-0128-B, ... */
export const ticketCodes = (o: { id: string; qty: number | null }) =>
  Array.from({ length: o.qty ?? 0 }, (_, i) => `TK-${o.id.slice(-4)}-${String.fromCharCode(65 + (i % 26))}`);

/** Semua pesanan tiket milik pengunjung (terbaru dulu). */
export const listVisitorOrders = async (visitorId: number) => {
  const [rows] = await pool.execute<VisitorOrderRow[]>(`${SELECT} WHERE vo.visitor_id = ? ORDER BY o.created_at DESC, o.id`, [visitorId]);
  return rows;
};

/** Pesanan dalam satu kode booking milik pengunjung (kosong bila bukan miliknya → 404, cegah IDOR). */
export const listBookingOrders = async (visitorId: number, code: string, db: Queryable = pool) => {
  const [rows] = await db.execute<VisitorOrderRow[]>(`${SELECT} WHERE vo.visitor_id = ? AND vo.booking_code = ? ORDER BY o.id`, [
    visitorId,
    code,
  ]);
  return rows;
};

export const bookingCodeTaken = async (code: string, db: Queryable = pool) => {
  const [rows] = await db.execute<RowDataPacket[]>('SELECT 1 FROM visitor_orders WHERE booking_code = ? LIMIT 1', [code]);
  return rows.length > 0;
};

/** Nomor urut terakhir pesanan tiket (4 digit terakhir id TK-MMYY-0001). */
export const lastTicketNumber = async (db: Queryable = pool) => {
  const [[row]] = await db.execute<RowDataPacket[]>(`SELECT MAX(CAST(RIGHT(id, 4) AS UNSIGNED)) AS last FROM orders WHERE id LIKE 'TK-%'`);
  return Number(row.last ?? 0);
};

/** Pesanan tiket baru dari aplikasi: belum dibayar, masuk menu Transaksi di dashboard. */
export const insertTicketOrder = async (
  o: { id: string; customer: string; eventId: string; service: string; serviceDate: string; qty: number; amount: number },
  db: Queryable,
) => {
  await db.execute(
    `INSERT INTO orders (id, type, customer, event_id, service, service_date, qty, amount, payment, created_at)
     VALUES (?, 'Tiket', ?, ?, ?, ?, ?, ?, 'Menunggu bayar', ?)`,
    [o.id, o.customer, o.eventId, o.service, o.serviceDate, o.qty, o.amount, new Date()],
  );
};

export const linkVisitorOrder = async (
  l: { orderId: string; visitorId: number; bookingCode: string; email: string; phone: string },
  db: Queryable,
) => {
  // REPLACE: id pesanan bisa terpakai ulang setelah data dashboard di-seed ulang (tautan lama ikut tertimpa).
  await db.execute(
    `REPLACE INTO visitor_orders (order_id, visitor_id, booking_code, buyer_email, buyer_phone, notified_status, created_at)
     VALUES (?, ?, ?, ?, ?, 'Menunggu bayar', ?)`,
    [l.orderId, l.visitorId, l.bookingCode, l.email, l.phone, new Date()],
  );
};

/** Tagihan sewa (id tagihan = id sewa), dibuat dashboard saat sewa disetujui. */
export const findRentalInvoice = async (rentalId: string, db: Queryable = pool) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT id, amount, payment, proof_method, proof_submitted_at, note, paid_at FROM orders WHERE rental_id = ? LIMIT 1',
    [rentalId],
  );
  return (
    (rows[0] as
      | { id: string; amount: number; payment: PaymentStatus; proof_method: string | null; proof_submitted_at: string | null; note: string | null; paid_at: string | null }
      | undefined) ?? null
  );
};

/**
 * Bukti transfer diunggah → "Perlu verifikasi" (antrean Transaksi di dashboard). Hanya mengubah tagihan
 * yang masih "Menunggu bayar"; jumlah baris yang berubah dikembalikan agar unggahan ganda terdeteksi.
 */
export const submitPaymentProof = async (
  ids: string[],
  proof: { method: string; file: string; from: string },
  db: Queryable,
) => {
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE orders SET payment = 'Perlu verifikasi', proof_method = ?, proof_file = ?, proof_from = ?, proof_submitted_at = ?, note = NULL
     WHERE payment = 'Menunggu bayar' AND id IN (${ids.map(() => '?').join()})`,
    [proof.method, proof.file, proof.from, new Date(), ...ids],
  );
  return result.affectedRows;
};

/** Perbarui status bayar terakhir yang sudah diketahui pengunjung (agar tidak muncul notifikasi untuk aksinya sendiri). */
export const setOrdersNotified = async (ids: string[], status: string, db: Queryable = pool) => {
  if (!ids.length) return;
  await db.execute(`UPDATE visitor_orders SET notified_status = ? WHERE order_id IN (${ids.map(() => '?').join()})`, [status, ...ids]);
};
