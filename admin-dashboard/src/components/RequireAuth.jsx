'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '../data/auth'

/** Halaman admin hanya bisa dibuka setelah login (simulasi). */
export default function RequireAuth({ children }) {
  const session = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (session === null) router.replace(pathname === '/' ? '/login' : `/login?from=${encodeURIComponent(pathname)}`)
  }, [session, pathname, router])

  // `undefined` = sesi belum terbaca (render server / hidrasi), `null` = belum login.
  if (!session) return null
  return children
}
