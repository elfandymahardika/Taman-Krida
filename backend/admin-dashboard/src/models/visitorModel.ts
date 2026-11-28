import pool, { transaction } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { iso } from '../lib/format';
import { SqlValue } from '../lib/http';

/*
 * Akun pengunjung aplikasi mobile (tabel `visitors`, dibuat lewat registrasi di aplikasi).
 * Dashboard hanya melihat ringkasan & mengubah status; password dan data pribadi tidak diubah admin.
 */

export type VisitorStatus = 'Aktif' | 'Nonaktif';

export interface VisitorSummary {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  status: VisitorStatus;
  disabled_note: string | null;
  disabled_at: string | null;
  created_at: string;
  orders: number;
  rentals: number;
  communities: number;
  active_sessions: number;
  last_login: string | null;
}

interface VisitorSummaryRow extends RowDataPacket, VisitorSummary {}

const SELECT = `
  SELECT v.id, v.name, v.email, v.phone, v.city, v.status, v.disabled_note, v.disabled_at, v.created_at,
    (SELECT COUNT(*) FROM visitor_orders vo WHERE vo.visitor_id = v.id) AS orders,
    (SELECT COUNT(*) FROM visitor_rentals vr WHERE vr.visitor_id = v.id) AS rentals,
    (SELECT COUNT(*) FROM visitor_communities vc WHERE vc.visitor_id = v.id) AS communities,
    (SELECT COUNT(*) FROM visitor_sessions s WHERE s.visitor_id = v.id AND s.revoked_at IS NULL AND s.expires_at > NOW(3)) AS active_sessions,
    (SELECT MAX(s.created_at) FROM visitor_sessions s WHERE s.visitor_id = v.id) AS last_login
  FROM visitors v`;

export const toVisitorSummary = (v: VisitorSummary) => ({
  id: Number(v.id),
  name: v.name,
  email: v.email,
  phone: v.phone,
  city: v.city ?? '',
  status: v.status,
  disabledNote: v.disabled_note ?? undefined,
  disabledAt: iso(v.disabled_at),
  createdAt: iso(v.created_at),
  orders: Number(v.orders),
  rentals: Number(v.rentals),
  communities: Number(v.communities),
  activeSessions: Number(v.active_sessions),
  lastLogin: iso(v.last_login),
});

/** Daftar akun (terbaru dulu) dengan filter `q` (nama/email/telepon) dan `status`. */
export const listVisitors = async (filter: { sql: string; params: SqlValue[] }, limit: number, offset: number) => {
  const [rows] = await pool.execute<VisitorSummaryRow[]>(
    `${SELECT} ${filter.sql} ORDER BY v.created_at DESC, v.id DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    filter.params,
  );
  const [[{ total }]] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM visitors v ${filter.sql}`, filter.params);
  return { rows, total: Number(total) };
};

export const findVisitorSummary = async (id: number): Promise<VisitorSummary | null> => {
  const [rows] = await pool.execute<VisitorSummaryRow[]>(`${SELECT} WHERE v.id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
};

/** Ringkasan untuk kartu metrik: total, aktif, nonaktif, baru 30 hari terakhir. */
export const visitorStats = async () => {
  const [[row]] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total, SUM(status = 'Aktif') AS active, SUM(status = 'Nonaktif') AS disabled,
            SUM(created_at >= NOW(3) - INTERVAL 30 DAY) AS recent
     FROM visitors`,
  );
  return { total: Number(row.total), active: Number(row.active ?? 0), disabled: Number(row.disabled ?? 0), recent: Number(row.recent ?? 0) };
};

/** Pesanan tiket & sewa terbaru milik akun (untuk rincian di dashboard). */
export const visitorActivity = async (id: number, limit = 5) => {
  const [orders] = await pool.execute<RowDataPacket[]>(
    `SELECT o.id, o.service, o.amount, o.payment, o.created_at FROM visitor_orders vo
     JOIN orders o ON o.id = vo.order_id WHERE vo.visitor_id = ? ORDER BY o.created_at DESC LIMIT ${Number(limit)}`,
    [id],
  );
  const [rentals] = await pool.execute<RowDataPacket[]>(
    `SELECT r.id, r.venue, r.date, r.approval FROM visitor_rentals vr
     JOIN rentals r ON r.id = vr.rental_id WHERE vr.visitor_id = ? ORDER BY r.submitted_at DESC LIMIT ${Number(limit)}`,
    [id],
  );
  return {
    orders: orders.map((o) => ({ id: o.id, service: o.service, amount: Number(o.amount), payment: o.payment, createdAt: iso(o.created_at) })),
    rentals: rentals.map((r) => ({ id: r.id, venue: r.venue, date: r.date, approval: r.approval })),
  };
};

/**
 * Ubah status akun. Menonaktifkan juga mencabut semua sesi login yang masih berlaku, sehingga aplikasi
 * langsung keluar pada permintaan berikutnya.
 */
export const setVisitorStatus = async (id: number, status: VisitorStatus, note: string | null) => {
  await transaction(async (conn) => {
    const now = new Date();
    await conn.execute('UPDATE visitors SET status = ?, disabled_note = ?, disabled_at = ?, updated_at = ? WHERE id = ?', [
      status,
      status === 'Nonaktif' ? note : null,
      status === 'Nonaktif' ? now : null,
      now,
      id,
    ]);
    if (status === 'Nonaktif') {
      await conn.execute('UPDATE visitor_sessions SET revoked_at = ? WHERE visitor_id = ? AND revoked_at IS NULL', [now, id]);
    }
  });
};

export const searchVisitors = async (pattern: string, limit: number) => {
  const [rows] = await pool.execute<VisitorSummaryRow[]>(
    `${SELECT} WHERE v.name LIKE ? OR v.email LIKE ? ORDER BY v.created_at DESC LIMIT ${Number(limit)}`,
    [pattern, pattern],
  );
  return rows;
};
