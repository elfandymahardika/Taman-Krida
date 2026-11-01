import { MAX_PASSWORD_BYTES } from './password';

/** Syarat password, ditampilkan juga di form registrasi frontend. */
export const PASSWORD_RULES = 'Minimal 8 karakter, memuat huruf besar, huruf kecil, dan angka.';

/**
 * Aturan kekuatan password (registrasi & ganti password): minimal 8 karakter, ada huruf besar,
 * huruf kecil, dan angka. Batas 72 byte karena bcrypt mengabaikan sisanya.
 * Mengembalikan pesan error pertama, atau `null` bila password cukup kuat.
 * Login tidak memakai aturan ini, agar akun lama dengan password lemah tetap bisa masuk.
 */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || !password) return 'Password wajib diisi.';
  if (password.length < 8) return 'Password minimal 8 karakter.';
  if (!/[A-Z]/.test(password)) return 'Password harus memuat huruf besar.';
  if (!/[a-z]/.test(password)) return 'Password harus memuat huruf kecil.';
  if (!/\d/.test(password)) return 'Password harus memuat angka.';
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) return `Password maksimal ${MAX_PASSWORD_BYTES} byte.`;
  return null;
}
