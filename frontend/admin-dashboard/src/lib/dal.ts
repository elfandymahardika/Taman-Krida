import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendFetch } from './backend'
import { SESSION_COOKIE } from './cookie'
import type { NoteInput } from './schemas'
import type { SessionUser } from './session'

/*
 * Data Access Layer (DAL): satu-satunya sumber kebenaran identitas user di server.
 * Sesi = cookie HttpOnly berisi token JWT; keabsahannya selalu dicek ke backend (/auth/me),
 * sehingga token yang sudah logout / akun yang dinonaktifkan langsung ditolak.
 * proxy.ts hanya pagar kasar (cek cookie ada); pengecekan sebenarnya ada di sini.
 */

export type CurrentUser = SessionUser & { id: number; loginAt: string }

type Session = { token: string; user: CurrentUser }

// React cache(): dalam satu render request, backend hanya ditanya sekali walau getCurrentUser() dipanggil berkali-kali.
const loadSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { user, session } = await backendFetch('/auth/me', { token })
    return { token, user: { ...user, loginAt: session.createdAt } }
  } catch (error) {
    // 401/403 = sesi dicabut, kedaluwarsa, atau akun tidak aktif → dianggap belum login.
    if (error.status === 401 || error.status === 403) return null
    throw error
  }
})

/** User yang sedang login; bila tidak ada sesi valid langsung dialihkan ke /login. */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await loadSession()
  if (!session) redirect('/login')
  return session.user
})

/** Sama seperti getCurrentUser tetapi tanpa redirect (untuk halaman publik seperti /login). */
export const getOptionalUser = cache(async (): Promise<CurrentUser | null> => (await loadSession())?.user ?? null)

/** Token sesi untuk memanggil backend atas nama user yang login. */
async function sessionToken() {
  const session = await loadSession()
  if (!session) redirect('/login')
  return session.token
}

/* ---------- Catatan staf ---------- */

export type Note = {
  id: number
  userId: number
  owner: string
  title: string
  content: string
  status: NoteInput['status']
  createdAt: string
  updatedAt: string
}

/** Catatan milik sendiri; `all` = semua staf (backend hanya mengabulkan untuk Administrator utama). */
export async function getNotes({ all = false } = {}) {
  return backendFetch<Note[]>(`/notes${all ? '?scope=all' : ''}`, { token: await sessionToken() })
}

/*
 * Mutasi. userId pemilik TIDAK dikirim dari sini maupun dari form: backend mengambilnya dari token sesi,
 * dan query ubah/hapus di backend selalu berpagar `WHERE id = ? AND user_id = ?` (anti-IDOR).
 */

export async function createNote(data: NoteInput) {
  return backendFetch<Note>('/notes', { token: await sessionToken(), method: 'POST', body: data })
}

export async function updateNote(id: number, data: NoteInput) {
  return backendFetch<Note>(`/notes/${id}`, { token: await sessionToken(), method: 'PUT', body: data })
}

export async function deleteNote(id: number) {
  await backendFetch(`/notes/${id}`, { token: await sessionToken(), method: 'DELETE' })
}

export async function archiveNote(id: number) {
  return backendFetch<Note>(`/notes/${id}/archive`, { token: await sessionToken(), method: 'PATCH' })
}
