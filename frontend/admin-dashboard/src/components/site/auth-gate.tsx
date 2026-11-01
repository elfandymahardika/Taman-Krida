'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogIn } from 'lucide-react'

/**
 * Ajakan login ketika pengguna mencoba fitur yang memerlukan akun, mis. sesi berakhir/dicabut saat
 * panel masih terbuka (API membalas 401). Hanya untuk UX — pemeriksaan sebenarnya tetap di backend.
 * Setelah login, pengguna kembali ke halaman yang sedang dibuka (?from=).
 */
export default function AuthGate({ reason = 'required', feature }: { reason?: 'required' | 'expired'; feature?: string }) {
  const pathname = usePathname()
  const href = pathname && pathname !== '/' ? `/login?from=${encodeURIComponent(pathname)}` : '/login'

  return (
    <main className="auth-gate">
      <section className="card forbidden" role="alert">
        <span className="forbidden__icon">
          <LogIn strokeWidth={1.75} />
        </span>
        <p className="forbidden__code">{reason === 'expired' ? '401 · Sesi berakhir' : 'Perlu login'}</p>
        <h1 className="forbidden__title">
          {reason === 'expired' ? 'Sesi Anda sudah berakhir' : `Masuk untuk ${feature ?? 'membuka halaman ini'}`}
        </h1>
        <p className="muted">
          {reason === 'expired'
            ? 'Anda keluar dari perangkat lain, akun dinonaktifkan, atau masa berlaku sesi habis. Masuk kembali untuk melanjutkan.'
            : 'Fitur ini hanya untuk staf TKBJ yang sudah login.'}
        </p>
        <Link className="btn btn--primary" href={href}>
          Masuk ke panel
        </Link>
      </section>
    </main>
  )
}
