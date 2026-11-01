import type { Access } from './access'

/*
 * Tipe data pengguna & respons auth dari backend (backend/admin-dashboard, /api/auth/*),
 * agar frontend tahu bentuk data yang diterima.
 */

/** Kunci peran staf, sama dengan enum `UserRole` di prisma/schema.prisma backend. */
export type RoleKey = 'admin' | 'acara' | 'keuangan' | 'sewa' | 'konten'

/** Profil staf yang dikirim backend (tanpa hash password). */
export type User = {
  id: number
  username: string
  name: string
  email: string
  /** Label peran untuk tampilan, mis. "Admin Acara". */
  role: string
  /** null = pendaftar yang belum disetujui Administrator utama. */
  roleKey: RoleKey | null
  initials: string
  /** Tingkat akses per modul ('y' ubah, 'p' lihat, 'n' tanpa akses) untuk membatasi menu & halaman. */
  access: Access
}

/** POST /api/auth/login */
export type AuthResponse = { token: string; expiresIn: string; user: User }

/** POST /api/auth/register — akun baru menunggu persetujuan, belum mendapat token. */
export type RegisterResponse = { message: string; user: User & { status: string } }

/** GET /api/auth/me */
export type MeResponse = { user: User; session: { createdAt: string; expiresAt: string } }

/** Profil di sisi browser; sebagian kolom bisa belum terisi (mis. sesi lama). */
export type SessionUser = Partial<User> & { username: string }

/** Sesi tampilan: profil + waktu login. Token TIDAK ada di sini (cookie HttpOnly). */
export type Session = { user: SessionUser; loginAt: string }
