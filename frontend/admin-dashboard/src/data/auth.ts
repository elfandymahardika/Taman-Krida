import { refreshUser } from '../lib/user-auth'

export { useSession } from '../lib/session'

/*
 * Autentikasi ke backend dijalankan di server (Server Action, app/(auth)/actions.ts):
 * - registerAction : POST /api/auth/register → akun "Menunggu persetujuan" (belum bisa login)
 * - loginAction    : POST /api/auth/login    → token JWT disimpan di cookie HttpOnly
 * - logoutAction   : POST /api/auth/logout   → sesi dicabut di server, cookie dihapus
 * Fungsi untuk komponen (useUser, login, logout, refreshUser) ada di lib/user-auth.ts.
 * Validasi isian memakai schema Zod di lib/validation/auth.ts. Backend menyimpan password sebagai hash bcrypt.
 */

export const auth = {
  /** Muat ulang profil & hak akses dari server (mis. setelah peran diubah admin). */
  refresh: refreshUser,
}
