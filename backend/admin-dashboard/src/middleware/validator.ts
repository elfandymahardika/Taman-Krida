import { Request, Response, NextFunction, RequestHandler } from 'express';
import { badRequest, FieldErrors } from '../lib/http';
import { DEFAULT_SETTINGS, SETTING_OPTIONS } from '../lib/settings';
import { DATE_RE, EMAIL_RE, isDate, isEmail, isString, PHONE_RE, str, text, TIME_RE, USERNAME_RE } from '../lib/validate';
import { validatePassword } from '../lib/validatePassword';

/*
 * Middleware validasi kelengkapan & format data sebelum diproses controller.
 * Respons gagal: 400 { error, fields: { kolom: pesan } } — dipakai formulir dashboard untuk pesan per kolom.
 * Aturan dasarnya ada di lib/validate.ts & lib/validatePassword.ts (dipakai ulang controller).
 * Pengecekan yang butuh database (username sudah dipakai, jadwal bentrok, dll.) dilakukan di controller.
 */

export { EMAIL_RE, USERNAME_RE };

export const VENUES = ['Pendopo Agung TKBJ', 'Panggung Terbuka', 'Gedung Kesenian & Galeri'];
export const EVENT_STATUSES = ['Terpublikasi', 'Draf'];
export const CONTENT_TYPES = ['Banner beranda', 'Berita', 'Pengumuman', 'Artikel budaya'];
export const CONTENT_STATUSES = ['Terpublikasi', 'Terjadwal', 'Draf'];

/** Password apa adanya (tanpa trim); selain string dianggap kosong. */
const secret = (v: unknown) => (isString(v) ? v : '');

/** Bungkus fungsi validasi menjadi middleware: error → 400, data bersih disimpan kembali ke req.body. */
const validate =
  (check: (body: Record<string, any>) => { data?: Record<string, unknown>; errors: FieldErrors }, message?: string): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const { data, errors } = check(req.body ?? {});
    if (Object.keys(errors).length) return next(badRequest(message ?? 'Periksa kembali isian formulir.', errors));
    if (data) req.body = { ...req.body, ...data };
    next();
  };

/**
 * Validasi kelengkapan data registrasi
 */
export const validateRegister = validate((body) => {
  const data = {
    name: text(body.name),
    username: str(body.username).toLowerCase(),
    email: str(body.email).toLowerCase(),
    password: secret(body.password),
    confirm: secret(body.confirm),
  };
  const errors: FieldErrors = {};
  if (data.name.length < 3) errors.name = 'Nama lengkap minimal 3 karakter.';
  else if (data.name.length > 60) errors.name = 'Nama lengkap maksimal 60 karakter.';
  if (!data.username) errors.username = 'Username wajib diisi.';
  else if (!USERNAME_RE.test(data.username)) errors.username = 'Username hanya boleh huruf kecil, angka, titik, atau garis bawah.';
  else if (data.username.length < 3 || data.username.length > 30) errors.username = 'Username 3–30 karakter.';
  if (!isEmail(data.email)) errors.email = 'Format email tidak valid.';
  const weak = validatePassword(data.password);
  if (weak) errors.password = weak;
  else if (data.confirm !== data.password) errors.confirm = 'Konfirmasi password tidak sama.';
  return { data, errors };
});

/**
 * Validasi kelengkapan data login
 */
export const validateLogin = validate((body) => {
  const data = { username: str(body.username).toLowerCase(), password: secret(body.password) };
  const errors: FieldErrors = {};
  if (!data.username) errors.username = 'Username wajib diisi.';
  else if (!USERNAME_RE.test(data.username)) errors.username = 'Username hanya boleh huruf, angka, titik, atau garis bawah.';
  if (!data.password) errors.password = 'Password wajib diisi.';
  else if (data.password.length < 6) errors.password = 'Password minimal 6 karakter.';
  return { data, errors };
});

/** Normalisasi kuota: '' / null / undefined → tanpa tiket. */
export const parseQuota = (q: unknown) => (q === '' || q === null || q === undefined ? null : Number(q));

/**
 * Validasi data acara (aturan sama dengan formulir di dashboard)
 */
export const validateEvent = validate((body) => {
  const errors: FieldErrors = {};
  const name = str(body.name);
  if (!name) errors.name = 'Nama acara wajib diisi.';
  else if (name.length < 3) errors.name = 'Nama acara minimal 3 karakter.';
  else if (name.length > 80) errors.name = 'Nama acara maksimal 80 karakter.';
  if (!str(body.organizer)) errors.organizer = 'Penyelenggara wajib diisi.';
  if (!body.date) errors.date = 'Tanggal wajib dipilih.';
  else if (!isDate(String(body.date))) errors.date = 'Format tanggal tidak valid.';
  if (!body.start) errors.start = 'Jam mulai wajib diisi.';
  else if (!TIME_RE.test(body.start)) errors.start = 'Format jam tidak valid.';
  if (!body.end) errors.end = 'Jam selesai wajib diisi.';
  else if (!TIME_RE.test(body.end)) errors.end = 'Format jam tidak valid.';
  else if (body.start && body.end <= body.start) errors.end = 'Jam selesai harus setelah jam mulai.';
  if (!VENUES.includes(body.venue)) errors.venue = 'Pilih lokasi yang tersedia.';
  if (body.status !== undefined && !EVENT_STATUSES.includes(body.status)) errors.status = 'Status publikasi tidak dikenal.';
  const quota = parseQuota(body.quota);
  if (quota !== null && (!Number.isInteger(quota) || quota < 0)) errors.quota = 'Kuota harus bilangan bulat ≥ 0.';
  if (body.price !== undefined && body.price !== '' && (!Number.isInteger(Number(body.price)) || Number(body.price) < 0))
    errors.price = 'Harga harus bilangan bulat ≥ 0.';
  return { data: { name, organizer: str(body.organizer) }, errors };
});

/**
 * Validasi pemesanan sewa gedung yang dicatat admin
 */
export const validateRental = validate((body) => {
  const data = {
    applicant: str(body.applicant),
    venue: body.venue,
    date: body.date,
    start: body.start || '08:00',
    end: body.end || '22:00',
    activity: str(body.activity) || 'Kegiatan budaya',
    note: str(body.note) || null,
  };
  const errors: FieldErrors = {};
  if (data.applicant.length < 3) errors.applicant = 'Nama pemesan minimal 3 karakter.';
  if (!VENUES.includes(data.venue)) errors.venue = 'Pilih fasilitas yang tersedia.';
  if (!DATE_RE.test(data.date ?? '')) errors.date = 'Tanggal sewa wajib dipilih.';
  if (!TIME_RE.test(data.start)) errors.start = 'Format jam tidak valid.';
  if (!TIME_RE.test(data.end)) errors.end = 'Format jam tidak valid.';
  else if (data.end <= data.start) errors.end = 'Jam selesai harus setelah jam mulai.';
  return { data, errors };
});

export const NOTE_STATUSES = ['Draf', 'Terpublikasi', 'Diarsipkan'];

/**
 * Validasi catatan staf (aturan sama dengan schema Zod di frontend: lib/schemas.ts).
 * Kolom pemilik (user_id) sengaja tidak dibaca dari body.
 */
export const validateNote = validate((body) => {
  const data = { title: str(body.title), content: str(body.content) || null, status: body.status ?? 'Draf' };
  const errors: FieldErrors = {};
  if (data.title.length < 3) errors.title = 'Judul minimal 3 karakter.';
  else if (data.title.length > 100) errors.title = 'Judul maksimal 100 karakter.';
  if (data.content && data.content.length > 500) errors.content = 'Isi catatan maksimal 500 karakter.';
  if (!NOTE_STATUSES.includes(data.status)) errors.status = 'Status catatan tidak dikenal.';
  return { data, errors };
});

/** Validasi konten. `partial` = hanya kolom yang dikirim (PUT boleh sebagian). */
const contentRules = (partial: boolean) =>
  validate((body) => {
    const errors: FieldErrors = {};
    const out: Record<string, string> = {};
    const has = (k: string) => !partial || body[k] !== undefined;
    if (has('title')) {
      out.title = str(body.title);
      if (out.title.length < 5) errors.title = 'Judul minimal 5 karakter.';
      else if (out.title.length > 120) errors.title = 'Judul maksimal 120 karakter.';
    }
    if (has('type')) {
      out.type = body.type;
      if (!CONTENT_TYPES.includes(out.type)) errors.type = 'Jenis konten tidak dikenal.';
    }
    if (body.status !== undefined) {
      out.status = body.status;
      if (!CONTENT_STATUSES.includes(out.status)) errors.status = 'Status tidak dikenal.';
    }
    for (const k of ['summary', 'body', 'cta', 'link']) if (body[k] !== undefined) out[k] = str(body[k]);
    if (out.summary?.length > 300) errors.summary = 'Isi ringkas maksimal 300 karakter.';
    if (out.body?.length > 1000) errors.body = 'Isi konten maksimal 1000 karakter.';
    if (out.cta !== undefined && out.cta.length > 30) errors.cta = 'Teks tombol maksimal 30 karakter.';
    if (out.link && !/^(\/|https?:\/\/)\S*$/.test(out.link)) errors.link = 'Tautan harus diawali "/" atau "https://".';
    // Hanya kolom tervalidasi yang diteruskan ke controller.
    return { data: { content: out }, errors };
  });

export const validateContent = contentRules(false);
export const validateContentUpdate = contentRules(true);

/**
 * Validasi metadata media galeri
 */
export function checkMediaMeta(body: Record<string, any>) {
  const meta = {
    title: str(body.title),
    collection: str(body.collection),
    description: str(body.description),
    credit: str(body.credit),
    date: str(body.date),
  };
  const errors: FieldErrors = {};
  if (meta.title.length < 3) errors.title = 'Judul minimal 3 karakter.';
  else if (meta.title.length > 100) errors.title = 'Judul maksimal 100 karakter.';
  if (!meta.collection) errors.collection = 'Koleksi wajib diisi.';
  else if (meta.collection.length > 60) errors.collection = 'Nama koleksi maksimal 60 karakter.';
  if (meta.description.length > 500) errors.description = 'Deskripsi maksimal 500 karakter.';
  if (!meta.credit) errors.credit = 'Kredit wajib diisi.';
  if (!isDate(meta.date)) errors.date = 'Tanggal dokumentasi tidak valid.';
  return { data: meta, errors };
}

export const validateMediaMeta = validate(checkMediaMeta);

/**
 * Validasi profil lembaga
 */
export const validateProfile = validate((body) => {
  const p = {
    name: str(body.name),
    manager: str(body.manager),
    address: str(body.address),
    phone: str(body.phone),
    whatsapp: str(body.whatsapp),
    hours: str(body.hours),
    about: str(body.about),
  };
  const errors: FieldErrors = {};
  if (p.name.length < 3) errors.name = 'Nama lembaga minimal 3 karakter.';
  if (!p.manager) errors.manager = 'Pengelola wajib diisi.';
  if (p.address.length < 10) errors.address = 'Alamat minimal 10 karakter.';
  if (!PHONE_RE.test(p.phone)) errors.phone = 'Nomor telepon tidak valid.';
  if (!PHONE_RE.test(p.whatsapp)) errors.whatsapp = 'Nomor WhatsApp tidak valid.';
  if (!p.hours) errors.hours = 'Jam layanan wajib diisi.';
  if (p.about.length < 20) errors.about = 'Deskripsi minimal 20 karakter.';
  else if (p.about.length > 500) errors.about = 'Deskripsi maksimal 500 karakter.';
  return { data: { profile: p }, errors };
});

const TEXT_SETTINGS: Record<string, { label: string; min: number; max: number }> = {
  serviceName: { label: 'Nama layanan', min: 3, max: 60 },
  cancelPolicy: { label: 'Kebijakan pembatalan', min: 10, max: 200 },
  bank: { label: 'Bank penerima', min: 3, max: 40 },
  account: { label: 'Nomor rekening', min: 6, max: 40 },
};
const BOOL_SETTINGS = Object.keys(DEFAULT_SETTINGS).filter((k) => typeof DEFAULT_SETTINGS[k as keyof typeof DEFAULT_SETTINGS] === 'boolean');

/**
 * Validasi pengaturan panel. Body = pengaturan lengkap (controller menggabungkan dengan nilai tersimpan).
 */
export function checkSettings(body: Record<string, any>) {
  const s: Record<string, unknown> = {};
  const errors: FieldErrors = {};
  for (const [key, rule] of Object.entries(TEXT_SETTINGS)) {
    const value = str(body[key]);
    s[key] = value;
    if (value.length < rule.min) errors[key] = `${rule.label} minimal ${rule.min} karakter.`;
    else if (value.length > rule.max) errors[key] = `${rule.label} maksimal ${rule.max} karakter.`;
  }
  s.email = str(body.email);
  if (!EMAIL_RE.test(s.email as string)) errors.email = 'Format email tidak valid.';
  const max = Number(body.maxTickets);
  s.maxTickets = String(body.maxTickets ?? '');
  if (!Number.isInteger(max) || max < 1 || max > 50) errors.maxTickets = 'Isi bilangan bulat 1–50.';
  for (const [key, options] of Object.entries(SETTING_OPTIONS)) {
    s[key] = body[key];
    if (!options.includes(body[key])) errors[key] = 'Pilih salah satu opsi yang tersedia.';
  }
  for (const key of BOOL_SETTINGS) s[key] = Boolean(body[key]);
  return { settings: s, errors };
}
