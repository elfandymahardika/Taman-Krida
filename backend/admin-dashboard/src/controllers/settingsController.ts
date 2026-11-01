import { Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import { assertValid } from '../lib/http';
import { DEFAULT_SETTINGS, SETTING_OPTIONS } from '../lib/settings';
import { checkSettings } from '../middleware/validator';
import { insertActivity } from '../models/feedModel';
import { getSettings, readKv, writeKv } from '../models/kvModel';

async function payload() {
  const kv = await readKv('settings');
  return { settings: await getSettings(), options: SETTING_OPTIONS, updatedAt: kv?.updatedAt, updatedBy: kv?.updatedBy };
}

/**
 * Pengaturan panel. Yang langsung berlaku di backend: sakelar notifikasi,
 * log aktivitas, durasi sesi (masa berlaku token), dan batas percobaan login.
 */
export const getPanelSettings = async (_req: Request, res: Response) => {
  res.json(await payload());
};

export const savePanelSettings = async (req: Request, res: Response) => {
  const current = await getSettings();
  const { settings, errors } = checkSettings({ ...current, ...req.body });
  assertValid(errors);
  await writeKv('settings', settings, res.locals.user.name);
  // Catat juga saat log baru saja dimatikan, agar perubahannya tetap terlacak.
  if (current.auditLog && !settings.auditLog) await insertActivity('system', 'Log aktivitas dimatikan', res.locals.user.name);
  else await logActivity('system', 'Pengaturan panel diperbarui', res.locals.user.name);
  res.json(await payload());
};

export const resetPanelSettings = async (_req: Request, res: Response) => {
  await writeKv('settings', DEFAULT_SETTINGS, res.locals.user.name);
  await logActivity('system', 'Pengaturan dikembalikan ke default', res.locals.user.name);
  res.json(await payload());
};
