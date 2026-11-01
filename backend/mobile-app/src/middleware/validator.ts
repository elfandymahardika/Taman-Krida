import { Request, Response, NextFunction, RequestHandler } from 'express';
import { COMMUNITY_CATEGORIES, findSlot, PAYMENT_METHODS, RENTAL_DOCUMENTS } from '../lib/catalog';
import { badRequest, FieldErrors } from '../lib/http';
import { isDate, isEmail, lengthError, phoneError, secret, str, text } from '../lib/validate';
import { validatePassword } from '../lib/validatePassword';

/*
 * Middleware validasi kelengkapan & format data sebelum diproses controller.
 * Respons gagal: 400 { error, fields: { kolom: pesan } } — dipakai aplikasi untuk pesan di bawah tiap kolom.
 * Aturan dasarnya ada di lib/validate.ts & lib/validatePassword.ts. Pengecekan yang butuh database
 * (email terdaftar, jadwal bentrok, kuota) ada di controller.
 */

export { isDate };

/** Bungkus fungsi validasi menjadi middleware: error → 400, data bersih disimpan kembali ke req.body. */
const validate =
  (check: (body: Record<string, any>, req: Request) => { data?: Record<string, unknown>; errors: Record<string, string | null> }, message?: string): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const { data, errors } = check(req.body ?? {}, req);
    const fields = Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as FieldErrors;
    if (Object.keys(fields).length) return next(badRequest(message ?? 'Periksa kembali isian formulir.', fields));
    if (data) req.body = { ...req.body, ...data };
    next();
  };

/** Kolom profil pengunjung (dipakai registrasi & edit profil). */
const profileFields = (body: Record<string, any>) => {
  const data = { name: text(body.name), email: str(body.email).toLowerCase(), phone: str(body.phone), city: text(body.city) || null };
  const errors = {
    name: lengthError(data.name, 'Nama', 3, 60),
    email: !data.email ? 'Alamat email wajib diisi.' : isEmail(data.email) ? null : 'Format email tidak valid, contoh: nama@email.com',
    phone: phoneError(data.phone),
    city: data.city && data.city.length > 60 ? 'Kota maksimal 60 karakter.' : null,
  };
  return { data, errors };
};

/**
 * Validasi kelengkapan data registrasi pengunjung. `confirm` opsional (dicek bila dikirim).
 */
export const validateRegister = validate((body) => {
  const profile = profileFields(body);
  const password = secret(body.password);
  return {
    data: { ...profile.data, password },
    errors: {
      ...profile.errors,
      password: validatePassword(password),
      confirm: body.confirm !== undefined && secret(body.confirm) !== password ? 'Konfirmasi kata sandi tidak sama.' : null,
    },
  };
});

/**
 * Validasi kelengkapan data login (email + kata sandi)
 */
export const validateLogin = validate((body) => {
  const data = { email: str(body.email).toLowerCase(), password: secret(body.password) };
  return {
    data,
    errors: {
      email: !data.email ? 'Alamat email wajib diisi.' : isEmail(data.email) ? null : 'Format email tidak valid, contoh: nama@email.com',
      password: data.password ? null : 'Kata sandi wajib diisi.',
    },
  };
});

export const validateProfile = validate((body) => profileFields(body));

export const validatePasswordChange = validate((body) => {
  const data = { current: secret(body.current), password: secret(body.password) };
  return {
    data,
    errors: {
      current: data.current ? null : 'Kata sandi saat ini wajib diisi.',
      password: validatePassword(data.password) ?? (data.password === data.current ? 'Kata sandi baru harus berbeda.' : null),
      confirm: body.confirm !== undefined && secret(body.confirm) !== data.password ? 'Konfirmasi kata sandi tidak sama.' : null,
    },
  };
});

/**
 * Validasi checkout tiket: items = [{ eventId, qty }], buyer = { name, email, phone } (opsional, bawaan dari profil akun).
 * Batas jumlah per acara & kuota dicek di controller (bergantung pengaturan dan data acara).
 */
export const validateCheckout = validate((body) => {
  const errors: Record<string, string | null> = {};
  const raw = Array.isArray(body.items) ? body.items : [];
  const items = raw.map((i: any) => ({ eventId: str(i?.eventId), qty: Number(i?.qty) }));
  if (!items.length) errors.items = 'Keranjang tiket masih kosong.';
  else if (items.length > 10) errors.items = 'Maksimal 10 acara dalam satu pesanan.';
  items.forEach((item: { eventId: string; qty: number }, i: number) => {
    if (!item.eventId) errors[`items.${i}.eventId`] = 'Acara wajib dipilih.';
    if (!Number.isInteger(item.qty) || item.qty < 1) errors[`items.${i}.qty`] = 'Jumlah tiket minimal 1.';
  });
  if (new Set(items.map((i: { eventId: string }) => i.eventId)).size !== items.length) errors.items = 'Acara yang sama hanya boleh muncul sekali.';

  let buyer: Record<string, unknown> | undefined;
  if (body.buyer !== undefined) {
    const b = profileFields(body.buyer ?? {});
    buyer = { name: b.data.name, email: b.data.email, phone: b.data.phone };
    for (const k of ['name', 'email', 'phone'] as const) errors[`buyer.${k}`] = b.errors[k];
  }
  return { data: { items, buyer }, errors };
});

/**
 * Validasi pengajuan sewa (multipart): kolom formulir + 3 berkas wajib dari rentalDocumentsUpload.
 */
export const validateRentalRequest = validate((body, req) => {
  const data = {
    facilityId: str(body.facilityId),
    date: str(body.date),
    slot: str(body.slot),
    activity: text(body.activity),
    applicant: text(body.applicant),
    contact: str(body.contact),
  };
  const files = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
  const errors: Record<string, string | null> = {
    facilityId: data.facilityId ? null : 'Pilih venue yang akan disewa.',
    date: !data.date ? 'Tanggal sewa wajib dipilih.' : isDate(data.date) ? null : 'Format tanggal tidak valid (YYYY-MM-DD).',
    slot: findSlot(data.slot) ? null : 'Pilih slot waktu yang tersedia.',
    activity: lengthError(data.activity, 'Nama kegiatan', 3, 200),
    applicant: lengthError(data.applicant, 'Nama pemohon', 3, 100),
    contact: phoneError(data.contact, 'Kontak'),
  };
  for (const doc of RENTAL_DOCUMENTS) if (!files[doc.key]?.[0]) errors[doc.key] = `${doc.label} wajib diunggah.`;
  return { data, errors };
});

/**
 * Validasi kolom pembayaran (multipart bersama berkas bukti): metode & nama pemilik rekening/akun pengirim.
 */
export const validatePayment = validate((body) => {
  const data = { method: str(body.method), sender: text(body.sender) };
  return {
    data,
    errors: {
      method: PAYMENT_METHODS.includes(data.method) ? null : `Pilih metode pembayaran: ${PAYMENT_METHODS.join(', ')}.`,
      sender: data.sender ? lengthError(data.sender, 'Nama pengirim', 3, 90) : null,
    },
  };
});

/**
 * Validasi pendaftaran komunitas (form "Daftarkan Komunitas").
 */
export const validateCommunity = validate((body) => {
  const year = new Date().getFullYear();
  const data = {
    name: text(body.name),
    category: str(body.category),
    leader: text(body.leader),
    phone: str(body.phone),
    city: text(body.city) || 'Jawa Timur',
    address: text(body.address),
    description: str(body.description),
    members: body.members === undefined || body.members === '' ? 0 : Number(body.members),
    foundedYear: body.foundedYear === undefined || body.foundedYear === '' ? null : Number(body.foundedYear),
  };
  return {
    data,
    errors: {
      name: lengthError(data.name, 'Nama komunitas', 3, 100),
      category: COMMUNITY_CATEGORIES.includes(data.category) ? null : `Pilih kategori: ${COMMUNITY_CATEGORIES.join(', ')}.`,
      leader: lengthError(data.leader, 'Nama ketua', 3, 100),
      phone: phoneError(data.phone, 'Nomor WhatsApp'),
      city: data.city.length > 60 ? 'Kota maksimal 60 karakter.' : null,
      address: lengthError(data.address, 'Alamat sekretariat', 10, 200),
      description: lengthError(data.description, 'Deskripsi', 20, 500),
      members: Number.isInteger(data.members) && data.members >= 0 && data.members <= 10000 ? null : 'Jumlah anggota harus bilangan bulat 0–10.000.',
      foundedYear:
        data.foundedYear === null || (Number.isInteger(data.foundedYear) && data.foundedYear >= 1900 && data.foundedYear <= year)
          ? null
          : `Tahun berdiri harus antara 1900 dan ${year}.`,
    },
  };
});
