'use client'

import { loginAction, logoutAction, registerAction } from '../app/(auth)/actions'
import { api, clearCache } from './api'
import { setSession, useSession } from './session'
import type { MeResponse, SessionUser } from './types'

/*
 * State pengguna untuk kebutuhan TAMPILAN: siapa yang login, peran & hak aksesnya, serta fungsi
 * login/logout. Token tidak pernah ada di sini — login/logout dijalankan Server Action yang menyimpan
 * atau menghapus cookie HttpOnly, dan setiap request tetap diperiksa backend (401/403).
 */

export { useSession }

/** Pengguna yang sedang login (null di luar panel atau setelah sesi berakhir). */
export function useUser(): SessionUser | null {
  return useSession()?.user ?? null
}

/** true bila pengguna Administrator utama (untuk menampilkan aksi moderasi). */
export function useIsAdmin() {
  return useUser()?.roleKey === 'admin'
}

/** Server Action login & daftar, dipakai form lewat useActionState (LoginForm/RegisterForm). */
export const login = loginAction
export const register = registerAction

/** Keluar: kosongkan cache data, cabut sesi di server & hapus cookie, lalu ke /login. */
export async function logout() {
  clearCache()
  await logoutAction()
}

/** Muat ulang profil & hak akses dari server (mis. setelah peran diubah admin). */
export async function refreshUser() {
  const { user, session } = await api<MeResponse>('/auth/me')
  setSession({ user, loginAt: session.createdAt })
}
