import { Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import { badRequest, likePattern, notFound, queryText, where } from '../lib/http';
import { paginated, pageRequest } from '../lib/pagination';
import {
  findVisitorSummary,
  listVisitors,
  setVisitorStatus,
  toVisitorSummary,
  visitorActivity,
  visitorStats,
} from '../models/visitorModel';

/*
 * Akun pengunjung aplikasi mobile (dashboard → Akun pengunjung, modul Pengguna & pengaturan).
 * Admin bisa melihat akun beserta ringkasan aktivitasnya, lalu menonaktifkan/mengaktifkan kembali.
 */

const STATUSES = ['Aktif', 'Nonaktif'];

/** GET /api/visitors?q=&status=&page=&limit= → daftar berhalaman. */
export const getVisitors = async (req: Request, res: Response) => {
  const q = queryText(req.query.q).trim();
  const status = queryText(req.query.status);
  const filter = where([
    q && ['(v.name LIKE ? OR v.email LIKE ? OR v.phone LIKE ?)', likePattern(q), likePattern(q), likePattern(q)],
    STATUSES.includes(status) && ['v.status = ?', status],
  ]);
  const page = pageRequest(req.query, { defaultLimit: 10, maxLimit: 100 }) ?? { page: 1, limit: 100, offset: 0 };
  const { rows, total } = await listVisitors(filter, page.limit, page.offset);
  res.json(paginated(rows.map(toVisitorSummary), total, page));
};

export const getVisitorStats = async (_req: Request, res: Response) => {
  res.json(await visitorStats());
};

const mustFind = async (id: string) => {
  const visitor = /^\d+$/.test(id) ? await findVisitorSummary(Number(id)) : null;
  if (!visitor) throw notFound('Akun pengunjung');
  return visitor;
};

/** Rincian akun + 5 pesanan tiket & 5 pengajuan sewa terbaru. */
export const getVisitor = async (req: Request<{ id: string }>, res: Response) => {
  const visitor = await mustFind(req.params.id);
  res.json({ ...toVisitorSummary(visitor), activity: await visitorActivity(Number(visitor.id)) });
};

/**
 * PATCH /api/visitors/:id { status, note } — Nonaktif: akun tidak bisa login dan semua sesinya dicabut
 * (wajib alasan, tampil di dashboard); Aktif: akun bisa login lagi. Data pesanan & sewa tidak dihapus.
 */
export const setVisitorAccountStatus = async (req: Request<{ id: string }>, res: Response) => {
  const visitor = await mustFind(req.params.id);
  const status = req.body?.status;
  const note = String(req.body?.note ?? '').trim();
  if (!STATUSES.includes(status)) throw badRequest('Status akun tidak dikenal.', { status: 'Pilih Aktif atau Nonaktif.' });
  if (status === 'Nonaktif' && note.length < 5) throw badRequest('Alasan wajib diisi.', { note: 'Tulis alasan minimal 5 karakter.' });
  if (note.length > 200) throw badRequest('Alasan maksimal 200 karakter.', { note: 'Maksimal 200 karakter.' });

  await setVisitorStatus(Number(visitor.id), status, note || null);
  if (status !== visitor.status) {
    await logActivity(
      'user',
      status === 'Nonaktif' ? 'Akun pengunjung dinonaktifkan' : 'Akun pengunjung diaktifkan kembali',
      `${res.locals.user.name} · ${visitor.name} (${visitor.email})${status === 'Nonaktif' ? ` · ${note}` : ''}`,
    );
  }
  res.json(toVisitorSummary((await findVisitorSummary(Number(visitor.id)))!));
};
