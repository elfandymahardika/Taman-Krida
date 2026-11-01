/*
 * Aturan validasi input backend yang dipakai ulang oleh middleware/validator.ts. Aturannya sama dengan
 * lib/core/utils/validators.dart di aplikasi Flutter, tetapi tetap diperiksa ulang di server karena
 * request bisa dikirim tanpa lewat aplikasi.
 */

export const EMAIL_RE = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/;
export const PHONE_RE = /^(08|\+628|628)\d{8,11}$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Benar bila nilai berupa string (bukan angka, objek, atau array yang menyamar). */
export const isString = (v: unknown): v is string => typeof v === 'string';

/** Teks dari input apa pun: dipangkas, nilai bukan string/angka menjadi ''. */
export const str = (v: unknown) => (isString(v) || typeof v === 'number' ? String(v).trim() : '');

/** Seperti `str`, spasi ganda dirapikan (nama orang/komunitas). */
export const text = (v: unknown) => str(v).replace(/\s+/g, ' ');

/** Kata sandi apa adanya (tanpa trim); selain string dianggap kosong. */
export const secret = (v: unknown) => (isString(v) ? v : '');

/** Format email masuk akal & tidak terlalu panjang (kolom 100 karakter). */
export const isEmail = (v: string) => v.length <= 100 && EMAIL_RE.test(v);

/** Tanggal "YYYY-MM-DD" yang benar-benar ada (2026-02-30 ditolak). */
export const isDate = (v: string) => DATE_RE.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().startsWith(v);

/** Nomor telepon/WhatsApp: spasi & tanda hubung diabaikan, format 08xxxxxxxxxx (10–13 digit). */
export const phoneError = (v: string, label = 'Nomor telepon') =>
  !v ? `${label} wajib diisi.` : PHONE_RE.test(v.replace(/[\s-]/g, '')) ? null : 'Nomor tidak valid. Gunakan format 08xxxxxxxxxx (10–13 digit).';

/** Pesan error panjang teks: wajib diisi, minimal & maksimal karakter. `null` = valid. */
export const lengthError = (v: string, label: string, min: number, max: number) =>
  !v ? `${label} wajib diisi.` : v.length < min ? `${label} minimal ${min} karakter.` : v.length > max ? `${label} maksimal ${max} karakter.` : null;
