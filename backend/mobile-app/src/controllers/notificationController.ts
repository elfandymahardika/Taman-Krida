import { Request, Response } from 'express';
import { notFound } from '../lib/http';
import { syncStatusNotifications } from '../lib/status';
import { listNotifications, markAllNotificationsRead, markNotificationRead, toNotification } from '../models/notificationModel';

/** Notifikasi akun (terbaru dulu). Keputusan admin terbaru disinkronkan dulu menjadi notifikasi. */
export const getNotifications = async (_req: Request, res: Response) => {
  await syncStatusNotifications(res.locals.userId);
  const items = (await listNotifications(res.locals.userId)).map(toNotification);
  res.json({ unread: items.filter((n) => !n.read).length, items });
};

export const readNotification = async (req: Request<{ id: string }>, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || !(await markNotificationRead(res.locals.userId, id))) throw notFound('Notifikasi');
  res.status(204).end();
};

export const readAllNotifications = async (_req: Request, res: Response) => {
  await markAllNotificationsRead(res.locals.userId);
  res.status(204).end();
};
