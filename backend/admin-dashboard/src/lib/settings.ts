/** Pengaturan panel bawaan. Nilai tersimpan di tabel `kv` (name = 'settings'), lihat models/kvModel.ts. */
export const DEFAULT_SETTINGS = {
  serviceName: 'Panel Administrator TKBJ',
  language: 'Bahasa Indonesia',
  timezone: 'WIB (UTC+7)',
  email: 'notifikasi@tkbj.jatimprov.go.id',
  notifyPayment: true,
  notifyRental: true,
  notifyCommunity: true,
  dailySummary: false,
  maxTickets: '10',
  payDeadline: '24 jam',
  cancelPolicy: 'Pembatalan paling lambat H-3 acara, dana kembali 50%.',
  autoIssue: true,
  waitlist: false,
  method: 'Transfer bank & QRIS',
  bank: 'Bank Jatim',
  account: '0011 2233 4455 (contoh)',
  requireProof: true,
  autoReminder: true,
  twoFactor: true,
  auditLog: true,
  session: '60 menit',
  attempts: '5 kali',
};

export type Settings = typeof DEFAULT_SETTINGS;

export const SETTING_OPTIONS: Record<string, string[]> = {
  language: ['Bahasa Indonesia', 'English'],
  timezone: ['WIB (UTC+7)', 'WITA (UTC+8)', 'WIT (UTC+9)'],
  payDeadline: ['6 jam', '12 jam', '24 jam', '48 jam'],
  method: ['Transfer bank & QRIS', 'Transfer bank', 'QRIS'],
  session: ['30 menit', '60 menit', '120 menit'],
  attempts: ['3 kali', '5 kali', '10 kali'],
};

/** "60 menit" → 60 (masa berlaku token JWT dalam menit). */
export const sessionMinutes = (settings: Settings) => parseInt(settings.session, 10) || 60;

/** "5 kali" → 5 */
export const maxAttempts = (settings: Settings) => parseInt(settings.attempts, 10) || 5;
