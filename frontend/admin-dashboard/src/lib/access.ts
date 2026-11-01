import { useSession } from './session'
import type { SessionUser } from './session'

/*
 * Otorisasi di sisi antarmuka (RBAC). Tingkat akses dikirim backend saat login (`user.access`)
 * dan berasal dari matriks peran yang sama dengan yang ditegakkan API, jadi UI dan server selalu sejalan.
 * UI hanya menyembunyikan/menolak tampilan; keputusan akhir tetap di backend (403).
 */

export type Module = 'events' | 'rentals' | 'payments' | 'info' | 'admin'
/** y = boleh mengubah, p = hanya lihat, n = tanpa akses. */
export type Level = 'y' | 'p' | 'n'
export type Access = Record<Module, Level>

export const MODULE_LABEL: Record<Module, string> = {
  events: 'Acara & tiket',
  rentals: 'Sewa gedung',
  payments: 'Transaksi',
  info: 'Informasi & komunitas',
  admin: 'Pengguna & pengaturan',
}

export const LEVEL_LABEL: Record<Level, string> = { y: 'ubah', p: 'lihat', n: 'tanpa akses' }

/** Halaman → modul. Halaman yang tidak tercantum (Dashboard) terbuka untuk semua staf. */
export const PAGE_MODULE: Record<string, Module> = {
  '/acara': 'events',
  '/tiket': 'events',
  '/sewa': 'rentals',
  '/transaksi': 'payments',
  '/profil': 'info',
  '/galeri': 'info',
  '/komunitas': 'info',
  '/konten': 'info',
  '/pengguna': 'admin',
  '/pengaturan': 'admin',
}

/** "/acara/123" → "events"; halaman umum → undefined. */
export const moduleOf = (pathname: string): Module | undefined => PAGE_MODULE[`/${pathname.split('/')[1]}`]

/** Tingkat akses pengguna pada modul. Tanpa modul (halaman umum) = 'y'; data akses belum ada = 'n'. */
export const levelOf = (user: SessionUser | undefined, module?: Module): Level => (module ? (user?.access?.[module] ?? 'n') : 'y')

/** Hak akses pengguna yang sedang login. */
export function useAccess() {
  const user = useSession()?.user
  return {
    level: (module?: Module) => levelOf(user, module),
    canView: (module?: Module) => levelOf(user, module) !== 'n',
    canEdit: (module?: Module) => levelOf(user, module) === 'y',
  }
}
