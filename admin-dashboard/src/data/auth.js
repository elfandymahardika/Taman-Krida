import { useSyncExternalStore } from 'react'

/*
 * Login simulasi: akun disimpan sebagai data contoh di sisi klien dan sesi
 * disimpan di localStorage. Bukan autentikasi sungguhan — hanya untuk prototipe.
 */

const SESSION_KEY = 'tkbj.session.v1'

export const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', name: 'Admin Pusat', role: 'Administrator utama', initials: 'AP' },
  { username: 'keuangan', password: 'keuangan123', name: 'Agus Prasetyo', role: 'Admin Keuangan', initials: 'AG' },
]

function read() {
  // Di server (render awal Next.js) tidak ada localStorage.
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null
  } catch {
    return null
  }
}

let session = read()
const listeners = new Set()

function set(next) {
  session = next
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // Sesi tetap berlaku di memori.
  }
  listeners.forEach((l) => l())
}

/** Validasi isian login. Mengembalikan objek error per kolom. */
export function validateLogin({ username, password }) {
  const errors = {}
  if (!username.trim()) errors.username = 'Username wajib diisi.'
  else if (!/^[a-z0-9._]+$/i.test(username.trim())) errors.username = 'Username hanya boleh huruf, angka, titik, atau garis bawah.'
  if (!password) errors.password = 'Password wajib diisi.'
  else if (password.length < 6) errors.password = 'Password minimal 6 karakter.'
  return errors
}

export const auth = {
  /** Mengembalikan akun jika cocok, atau null jika username/password salah. */
  login(username, password) {
    const account = DEMO_ACCOUNTS.find(
      (a) => a.username === username.trim().toLowerCase() && a.password === password,
    )
    if (!account) return null
    const { password: _omit, ...user } = account
    set({ user, loginAt: new Date().toISOString() })
    return user
  },
  logout() {
    set(null)
  },
}

/**
 * Sesi login aktif. Bernilai `undefined` selama render server dan hidrasi
 * (sesi belum bisa dibaca), lalu `null` atau objek sesi di browser.
 */
export function useSession() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => session,
    () => undefined,
  )
}
