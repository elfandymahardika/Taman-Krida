import { Request, Response } from 'express';
import { queryText } from '../lib/http';
import { ACTIVITY_MODULE, canOpen, canView } from '../lib/roles';
import { ACTIVITY_KINDS, listActivity, listNotifications, markNotificationsRead, toActivity, toNotification } from '../models/feedModel';

/** Log aktivitas dengan paginasi kursor: `?limit=8&before=<id>&kind=payment`. */
export const getActivity = async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 50);
  const before = Number(req.query.before) || null;
  const kind = ACTIVITY_KINDS.includes(queryText(req.query.kind)) ? queryText(req.query.kind) : null;
  // Jenis aktivitas dari modul yang tidak boleh dilihat peran ini disembunyikan.
  const allowedKinds = ACTIVITY_KINDS.filter((k) => !ACTIVITY_MODULE[k] || canView(res.locals.user.role_key, ACTIVITY_MODULE[k]));
  const rows = await listActivity({ before, kind, allowedKinds, limit: limit + 1 });
  const items = rows.slice(0, limit).map(toActivity);
  res.json({ items, nextCursor: rows.length > limit ? items.at(-1)!.id : null });
};

/** Notifikasi yang tautannya boleh dibuka peran ini. */
const visibleNotifications = async (role: string | null) => (await listNotifications()).filter((n) => canOpen(role, n.link));

async function notificationsPayload(role: string | null) {
  const rows = await visibleNotifications(role);
  return { items: rows.slice(0, 20).map(toNotification), unread: rows.filter((n) => !n.read_at).length };
}

export const getNotifications = async (_req: Request, res: Response) => {
  res.json(await notificationsPayload(res.locals.user.role_key));
};

export const readAllNotifications = async (_req: Request, res: Response) => {
  const role = res.locals.user.role_key;
  await markNotificationsRead((await visibleNotifications(role)).map((n) => n.id));
  res.json(await notificationsPayload(role));
};

export const readNotification = async (req: Request<{ id: string }>, res: Response) => {
  await markNotificationsRead([Number(req.params.id)]);
  res.json(await notificationsPayload(res.locals.user.role_key));
};
