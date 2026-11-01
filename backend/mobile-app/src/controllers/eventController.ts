import { Request, Response } from 'express';
import { config } from '../config/env';
import { likePattern, notFound, queryText, where } from '../lib/http';
import { getSettings, payDeadlineHours } from '../models/adminModel';
import { findPublishedEvent, listPublishedEvents, toEvent } from '../models/eventModel';

/**
 * Kalender acara (hanya yang Terpublikasi di dashboard).
 * ?from=&to= (YYYY-MM-DD, bawaan: mulai hari ini) · ?category=Wayang · ?q=kata kunci · ?ticketed=1 · ?all=1 (termasuk yang sudah lewat)
 */
export const getEvents = async (req: Request, res: Response) => {
  const [from, to, q, category] = ['from', 'to', 'q', 'category'].map((k) => queryText(req.query[k]));
  const pattern = likePattern(q);
  const filter = where([
    (from || req.query.all !== '1') && ['e.date >= ?', from || config.today],
    to && ['e.date <= ?', to],
    q && ['(e.name LIKE ? OR e.organizer LIKE ? OR e.venue LIKE ?)', pattern, pattern, pattern],
    req.query.ticketed === '1' && ['e.quota IS NOT NULL AND e.price IS NOT NULL'],
  ]);
  const rows = await listPublishedEvents(filter, payDeadlineHours(await getSettings()));
  // Kategori ditebak dari nama acara, jadi disaring setelah query.
  const events = rows.map(toEvent);
  res.json(category && category !== 'Semua' ? events.filter((e) => e.category === category) : events);
};

export const getEvent = async (req: Request<{ id: string }>, res: Response) => {
  const event = await findPublishedEvent(req.params.id, payDeadlineHours(await getSettings()));
  if (!event) throw notFound('Acara');
  res.json({ ...toEvent(event), isPast: event.date < config.today });
};
