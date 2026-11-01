import { Request, Response } from 'express';
import { shortDate } from '../lib/format';
import { likePattern, queryText } from '../lib/http';
import { canOpen, roleLabel } from '../lib/roles';
import { searchCommunities } from '../models/communityModel';
import { searchContents } from '../models/contentModel';
import { searchEvents } from '../models/eventModel';
import { searchMedia } from '../models/mediaModel';
import { orderSummary, searchOrders } from '../models/orderModel';
import { searchRentals } from '../models/rentalModel';
import { searchUsers } from '../models/userModel';

const PER_TYPE = 5;

/** Pencarian global topbar: acara, transaksi, sewa, komunitas, konten, galeri, dan staf. */
export const search = async (req: Request, res: Response) => {
  const q = queryText(req.query.q).trim();
  if (q.length < 2) {
    res.json({ query: q, results: [] });
    return;
  }
  const p = likePattern(q);

  const events = (await searchEvents(p, PER_TYPE)).map((e) => ({
    type: 'Acara',
    id: e.id,
    title: e.name,
    sub: `${shortDate(e.date)} · ${e.venue} · ${e.status}`,
    href: '/acara',
  }));
  const orders = (await searchOrders(p, PER_TYPE)).map((o) => ({
    type: 'Transaksi',
    id: o.id,
    title: o.id,
    sub: `${orderSummary(o)} · ${o.payment}`,
    href: '/transaksi',
  }));
  const rentals = (await searchRentals(p, PER_TYPE)).map((r) => ({
    type: 'Sewa',
    id: r.id,
    title: `${r.id} · ${r.applicant}`,
    sub: `${r.venue} · ${shortDate(r.date)} · ${r.approval}`,
    href: '/sewa',
  }));
  const communities = (await searchCommunities(p, PER_TYPE)).map((c) => ({
    type: 'Komunitas',
    id: c.id,
    title: c.name,
    sub: `${c.category} · ${c.city} · ${c.status}`,
    href: '/komunitas',
  }));
  const contents = (await searchContents(p, PER_TYPE)).map((c) => ({
    type: 'Konten',
    id: c.id,
    title: c.title,
    sub: `${c.type} · ${c.status}`,
    href: '/konten',
  }));
  const media = (await searchMedia(p, PER_TYPE)).map((m) => ({
    type: 'Galeri',
    id: m.id,
    title: m.title,
    sub: `${m.type} · ${m.collection} · ${m.status}`,
    href: '/galeri',
  }));
  const users = (await searchUsers(p, PER_TYPE)).map((u) => ({
    type: 'Staf',
    id: String(u.id),
    title: u.name,
    sub: `${u.email} · ${roleLabel(u.role_key)} · ${u.status}`,
    href: '/pengguna',
  }));

  // Hanya hasil dari halaman yang boleh dibuka peran ini.
  const results = [...events, ...orders, ...rentals, ...communities, ...contents, ...media, ...users].filter((r) =>
    canOpen(res.locals.user.role_key, r.href),
  );
  res.json({ query: q, results });
};
