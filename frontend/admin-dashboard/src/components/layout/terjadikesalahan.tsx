'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { TriangleAlert } from 'lucide-react'

/**
 * Kode rujukan error dari server (`digest`) untuk dicocokkan dengan log server (instrumentation.ts).
 * Error yang terjadi di browser tidak punya digest.
 */
export const errorDigest = (error: unknown) =>
  typeof error === 'object' && error !== null && 'digest' in error && error.digest ? String(error.digest) : undefined

type Props = {
  error: unknown
  /** `retry()` dari error boundary Next.js: ambil ulang data dari server lalu render ulang segmen. */
  retry: () => void
  /** true = di luar layout panel (tanpa sidebar), kartu ditaruh di tengah layar. */
  standalone?: boolean
}

/**
 * Tampilan error untuk error boundary (app/error.tsx, app/(dashboard)/error.tsx, app/global-error.tsx).
 * Pesan asli error SENGAJA tidak ditampilkan: bisa berisi detail internal. Pengguna hanya melihat pesan aman,
 * tombol coba lagi, dan kode rujukan (digest) yang bisa diberikan ke admin untuk dicari di log server.
 */
export default function TerjadiKesalahan({ error, retry, standalone }: Props) {
  useEffect(() => {
    // Detail lengkap hanya di konsol browser untuk keperluan debugging.
    console.error(error)
  }, [error])

  const digest = errorDigest(error)
  const card = (
    <section className="card forbidden" role="alert">
      <span className="forbidden__icon">
        <TriangleAlert strokeWidth={1.75} />
      </span>
      <p className="forbidden__code">Terjadi kesalahan</p>
      <h1 className="forbidden__title">Halaman ini gagal dimuat</h1>
      <p className="muted">
        Maaf, ada kendala saat menampilkan halaman. Coba lagi beberapa saat lagi; bila masih gagal, hubungi Administrator utama
        {digest ? (
          <>
            {' '}
            dan sebutkan kode <code>{digest}</code>.
          </>
        ) : (
          '.'
        )}
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={() => retry()}>
          Coba lagi
        </button>
        <Link className="btn" href="/">
          Kembali ke Dashboard
        </Link>
      </div>
    </section>
  )
  return standalone ? <main className="status-page">{card}</main> : card
}
