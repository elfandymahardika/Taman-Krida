import { Request, Response } from 'express';
import { config } from '../config/env';
import {
  COMMUNITY_CATEGORIES,
  EVENT_CATEGORIES,
  PAYMENT_METHODS,
  RENTAL_DOCUMENTS,
  RENTAL_SLOTS,
} from '../lib/catalog';
import { notFound, queryText, where } from '../lib/http';
import { getSettings, maxTickets, payDeadlineHours, readKv } from '../models/adminModel';
import { listPublishedEvents, toEvent } from '../models/eventModel';
import {
  findHeroBanner,
  findPublishedContent,
  findPublishedMedia,
  listFacilities,
  listPublishedContents,
  listPublishedMedia,
  toContent,
  toFacility,
  toMedia,
} from '../models/infoModel';

/** Pilihan & aturan yang dipakai formulir aplikasi (kategori, slot sewa, metode bayar, batas tiket, rekening). */
export const getMeta = async (_req: Request, res: Response) => {
  const settings = await getSettings();
  res.json({
    today: config.today,
    eventCategories: EVENT_CATEGORIES,
    communityCategories: COMMUNITY_CATEGORIES,
    rentalSlots: RENTAL_SLOTS,
    rentalDocuments: RENTAL_DOCUMENTS,
    paymentMethods: PAYMENT_METHODS,
    tickets: { maxPerEvent: maxTickets(settings), payDeadlineHours: payDeadlineHours(settings), cancelPolicy: settings.cancelPolicy },
    bankAccount: { bank: settings.bank, account: settings.account },
  });
};

/** Profil lembaga dari menu Profil di dashboard (tabel kv, name = 'profile'). */
const readProfile = async () => (await readKv<Record<string, string>>('profile')) ?? {};

/** Isi beranda dalam satu permintaan: profil singkat, banner, agenda terdekat, dan berita terbaru. */
export const getHome = async (_req: Request, res: Response) => {
  const settings = await getSettings();
  const [profile, banner, upcoming, news] = await Promise.all([
    readProfile(),
    findHeroBanner(),
    listPublishedEvents(where([['e.date >= ?', config.today]]), payDeadlineHours(settings), 4),
    listPublishedContents('', 20),
  ]);
  res.json({
    profile,
    banner: banner ? toContent(banner) : null,
    upcomingEvents: upcoming.map(toEvent),
    news: news
      .filter((c) => c.type !== 'Banner beranda')
      .slice(0, 3)
      .map(toContent),
  });
};

export const getProfile = async (_req: Request, res: Response) => {
  res.json({ profile: await readProfile(), facilities: (await listFacilities()).map(toFacility) });
};

export const getFacilities = async (_req: Request, res: Response) => {
  res.json((await listFacilities()).map(toFacility));
};

/** Virtual galeri: ?type=Foto|Video&collection= */
export const getGallery = async (req: Request, res: Response) => {
  const [type, collection] = ['type', 'collection'].map((k) => queryText(req.query[k]));
  const rows = await listPublishedMedia(where([type && ['type = ?', type], collection && ['collection = ?', collection]]));
  res.json(rows.map(toMedia));
};

/** Koleksi galeri (untuk chip filter & kartu album): nama, jumlah item, sampul, tanggal terbaru. */
export const getGalleryCollections = async (_req: Request, res: Response) => {
  const groups = new Map<string, ReturnType<typeof toMedia>[]>();
  for (const m of (await listPublishedMedia(where([]))).map(toMedia)) groups.set(m.collection, [...(groups.get(m.collection) ?? []), m]);
  res.json([...groups].map(([name, items]) => ({ name, count: items.length, cover: items[0], latestDate: items[0].date })));
};

export const getGalleryItem = async (req: Request<{ id: string }>, res: Response) => {
  const media = await findPublishedMedia(req.params.id);
  if (!media) throw notFound('Item galeri');
  res.json(toMedia(media));
};

/** Konten terpublikasi: ?type=Berita|Pengumuman|Artikel budaya|Banner beranda */
export const getContents = async (req: Request, res: Response) => {
  res.json((await listPublishedContents(queryText(req.query.type))).map(toContent));
};

export const getContent = async (req: Request<{ id: string }>, res: Response) => {
  const content = await findPublishedContent(req.params.id);
  if (!content) throw notFound('Konten');
  res.json(toContent(content));
};
