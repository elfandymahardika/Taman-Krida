'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import AuthGate from '../components/site/auth-gate'
import type { Session } from './types'

/*
 * Sesi login di sisi browser: HANYA profil & hak akses untuk tampilan (menu, guard halaman, topbar).
 * Token login disimpan di cookie HttpOnly dan tidak pernah bisa dibaca JavaScript. Profil diisi oleh
 * layout server dari DAL (getCurrentUser), lalu dibagikan ke Client Component lewat context ini.
 * Hook untuk komponen ada di lib/user-auth.ts (useUser, logout, dll.).
 */

export type { Session, SessionUser } from './types'

const SessionContext = createContext<Session | null>(null)

// Pengubah sesi milik provider yang sedang tampil, agar lib/api.ts (bukan komponen) bisa mengosongkan sesi saat 401.
let update: ((next: Session | null) => void) | null = null

export function SessionProvider({ session, children }: { session: Session; children: ReactNode }) {
  const [current, setCurrent] = useState<Session | null>(session)
  const [fromServer, setFromServer] = useState(session)

  // Profil baru dari server (mis. setelah navigasi yang merender ulang layout) menggantikan yang lama.
  if (session !== fromServer) {
    setFromServer(session)
    setCurrent(session)
  }

  useEffect(() => {
    update = setCurrent
    return () => {
      update = null
    }
  }, [])

  // Sesi dicabut di server (API membalas 401) → isi halaman diganti ajakan masuk kembali.
  return (
    <SessionContext.Provider value={current}>
      {current ? children : <AuthGate reason="expired" />}
    </SessionContext.Provider>
  )
}

/** Sesi aktif, atau null di luar halaman panel (login/daftar). */
export function useSession() {
  return useContext(SessionContext)
}

/** Ganti profil sesi (mis. hasil /auth/me terbaru) atau kosongkan (null) bila server menolak sesi. */
export function setSession(next: Session | null) {
  update?.(next)
}
