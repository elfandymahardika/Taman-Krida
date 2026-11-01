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

/** Akun demo per peran dari data contoh backend (ditampilkan di halaman login). */
export const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'Administrator utama' },
  { username: 'nur.aini', password: 'tkbj2026', role: 'Admin Acara' },
  { username: 'keuangan', password: 'keuangan123', role: 'Admin Keuangan' },
  { username: 'rina.s', password: 'tkbj2026', role: 'Admin Sewa' },
  { username: 'siti.rahma', password: 'tkbj2026', role: 'Admin Konten' },
]

export const auth = {
  /** Muat ulang profil & hak akses dari server (mis. setelah peran diubah admin). */
  refresh: refreshUser,
}
