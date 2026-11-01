/*
 * Aturan validasi input backend yang dipakai ulang oleh middleware/validator.ts dan controller.
 * Semua input dari klien dianggap tidak tepercaya: diperiksa tipe & formatnya di sini, walau
 * frontend sudah memvalidasi (request bisa dikirim tanpa lewat form web).
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const USERNAME_RE = /^[a-z0-9._]+$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const PHONE_RE = /^[0-9()+\-\s]{8,20}$/;

/** Benar bila nilai berupa string (bukan angka, objek, atau array yang menyamar). */
export const isString = (v: unknown): v is string => typeof v === 'string';

/** Teks dari input apa pun: dipangkas, nilai bukan string/angka menjadi ''. */
export const str = (v: unknown) => (isString(v) || typeof v === 'number' ? String(v).trim() : '');

/** Seperti `str`, spasi ganda dirapikan (nama orang, judul). */
export const text = (v: unknown) => str(v).replace(/\s+/g, ' ');

/** Format email masuk akal & tidak terlalu panjang (kolom 100 karakter). */
export const isEmail = (v: unknown): v is string => isString(v) && v.length <= 100 && EMAIL_RE.test(v);

/** Tanggal "YYYY-MM-DD" yang benar-benar ada (2026-02-30 ditolak). */
export const isDate = (v: unknown): v is string =>
  isString(v) && DATE_RE.test(v) && !Number.isNaN(Date.parse(v)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);

/** Jam "HH:MM" 00:00–23:59. */
export const isTime = (v: unknown): v is string => isString(v) && TIME_RE.test(v);

/** Pesan error panjang teks: wajib diisi, minimal & maksimal karakter. `null` = valid. */
export function lengthError(value: string, label: string, min: number, max: number) {
  if (!value) return `${label} wajib diisi.`;
  if (value.length < min) return `${label} minimal ${min} karakter.`;
  if (value.length > max) return `${label} maksimal ${max} karakter.`;
  return null;
}
