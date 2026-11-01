import { MAX_PASSWORD_BYTES } from './password';

/**
 * Aturan kekuatan kata sandi (registrasi & ganti kata sandi), sama dengan backend dashboard dan
 * aplikasi Flutter: minimal 8 karakter, ada huruf besar, huruf kecil, dan angka; maksimal 72 byte
 * (batas bcrypt). Mengembalikan pesan error pertama, atau `null` bila cukup kuat.
 * Login tidak memakai aturan ini, agar akun lama tetap bisa masuk.
 */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || !password) return 'Kata sandi wajib diisi.';
  if (password.length < 8) return 'Kata sandi minimal 8 karakter.';
  if (!/[A-Z]/.test(password)) return 'Kata sandi harus memuat huruf besar.';
  if (!/[a-z]/.test(password)) return 'Kata sandi harus memuat huruf kecil.';
  if (!/\d/.test(password)) return 'Kata sandi harus memuat angka.';
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) return `Kata sandi maksimal ${MAX_PASSWORD_BYTES} byte.`;
  return null;
}
