import bcrypt from 'bcryptjs';

/** Cost factor bcrypt (2^10 putaran), sama dengan API dashboard. */
const COST = 10;

/** bcrypt hanya memakai 72 byte pertama, jadi password lebih panjang ditolak saat registrasi. */
export const MAX_PASSWORD_BYTES = 72;

/** Hash password dengan bcrypt. Hasilnya berformat `$2b$10$<salt><hash>` (salt acak sudah termasuk). */
export const hashPassword = (password: string) => bcrypt.hash(password, COST);

// Dipakai saat email tidak ditemukan agar waktu respons sama (tidak membocorkan email yang terdaftar).
const DUMMY_HASH = bcrypt.hashSync('password-tidak-pernah-cocok', COST);

/** Cocokkan password dengan hash tersimpan. Hash kosong selalu gagal. */
export async function verifyPassword(password: string, stored: string | null | undefined) {
  if (stored?.startsWith('$2')) return bcrypt.compare(password, stored);
  await bcrypt.compare(password, DUMMY_HASH);
  return false;
}
