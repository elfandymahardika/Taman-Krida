import { scryptSync, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';

/** Cost factor bcrypt (2^10 putaran). Hash lama dengan cost lebih kecil di-hash ulang saat login. */
const COST = 10;

/** bcrypt hanya memakai 72 byte pertama, jadi password lebih panjang ditolak saat registrasi. */
export const MAX_PASSWORD_BYTES = 72;

/** Hash password dengan bcrypt. Hasilnya berformat `$2b$10$<salt><hash>` (salt acak sudah termasuk). */
export const hashPassword = (password: string) => bcrypt.hash(password, COST);

// Dipakai saat username tidak ditemukan agar waktu respons sama (tidak membocorkan username yang terdaftar).
const DUMMY_HASH = bcrypt.hashSync('password-tidak-pernah-cocok', COST);

/** Cocokkan password dengan hash tersimpan. `stored` kosong/tidak dikenal selalu gagal. */
export async function verifyPassword(password: string, stored: string | null | undefined) {
  const value = String(stored ?? '');
  if (value.startsWith('$2')) return bcrypt.compare(password, value);
  if (value.startsWith('scrypt$')) return verifyLegacyScrypt(password, value);
  await bcrypt.compare(password, DUMMY_HASH);
  return false;
}

/** True bila hash perlu diganti ke bcrypt dengan cost saat ini (mis. hash scrypt dari versi lama). */
export const needsRehash = (stored: string) => !stored.startsWith('$2') || bcrypt.getRounds(stored) < COST;

/** Format lama sebelum bcrypt: scrypt$<salt hex>$<hash hex>. */
export function verifyLegacyScrypt(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}
