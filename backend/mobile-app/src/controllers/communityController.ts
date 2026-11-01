import { Request, Response } from 'express';
import { transaction } from '../config/db';
import { assertValid, likePattern, notFound, queryText, retryOnDuplicate, where } from '../lib/http';
import { logActivity, notifyAdmin } from '../models/adminModel';
import {
  communityIdTaken,
  communityNameTaken,
  findActiveCommunity,
  insertPendingCommunity,
  linkVisitorCommunity,
  listActiveCommunities,
  listVisitorCommunities,
  toCommunity,
  toRegistration,
} from '../models/communityModel';
import { insertNotification } from '../models/notificationModel';

/** Sama dengan slug() di dashboard: "Sanggar Tari Mekar Sari" → "sanggar-tari-mekar-sari". */
const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'komunitas';

/** Direktori komunitas (hanya yang Aktif): ?category=&q= */
export const getCommunities = async (req: Request, res: Response) => {
  const [category, q] = ['category', 'q'].map((k) => queryText(req.query[k]));
  const pattern = likePattern(q);
  const rows = await listActiveCommunities(
    where([category && category !== 'Semua' && ['category = ?', category], q && ['(name LIKE ? OR city LIKE ? OR leader LIKE ?)', pattern, pattern, pattern]]),
  );
  res.json(rows.map(toCommunity));
};

export const getCommunity = async (req: Request<{ id: string }>, res: Response) => {
  const community = await findActiveCommunity(req.params.id);
  if (!community) throw notFound('Komunitas');
  res.json(toCommunity(community));
};

/**
 * Daftarkan komunitas → antrean "Menunggu persetujuan" di menu Komunitas dashboard.
 * Setelah disetujui admin, komunitas tampil di direktori dan pendaftar mendapat notifikasi.
 */
export const registerCommunity = async (req: Request, res: Response) => {
  const visitor = res.locals.visitor;
  const { name, category, leader, phone, city, address, description, members, foundedYear } = req.body;
  if (await communityNameTaken(name)) assertValid({ name: 'Komunitas dengan nama ini sudah terdaftar atau sedang ditinjau.' });

  const id = await retryOnDuplicate(() =>
    transaction(async (conn) => {
      let id = slug(name);
      while (await communityIdTaken(id, conn)) id = `${slug(name)}-${Math.random().toString(36).slice(2, 6)}`;
      await insertPendingCommunity(
        { id, name, category, city, members, contact: phone, leader, since: foundedYear ? `Berdiri ${foundedYear}` : null },
        conn,
      );
      await linkVisitorCommunity({ communityId: id, visitorId: visitor.id, address, description }, conn);
      await logActivity('community', 'Pendaftaran komunitas dari aplikasi', `${name} · ${leader}`, conn);
      await notifyAdmin(`${name} mendaftar ke direktori komunitas — menunggu persetujuan`, '/komunitas', 'community', conn);
      await insertNotification(
        visitor.id,
        { symbol: '👥', title: 'Pendaftaran komunitas terkirim', body: `${name} sedang ditinjau pengelola TKBJ.`, target: 'communities', targetId: id },
        conn,
      );
      return id;
    }),
  );
  const registration = (await listVisitorCommunities(visitor.id)).find((c) => c.id === id)!;
  res.status(201).json(toRegistration(registration));
};

/** Pendaftaran komunitas milik pengunjung beserta keputusan admin. */
export const getMyCommunities = async (_req: Request, res: Response) => {
  res.json((await listVisitorCommunities(res.locals.userId)).map(toRegistration));
};
