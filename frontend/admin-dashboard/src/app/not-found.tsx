import type { Metadata } from 'next'
import Link from 'next/link'
import { SearchX } from 'lucide-react'

export const metadata: Metadata = { title: 'Halaman tidak ditemukan' }

/**
 * Halaman 404: rute yang tidak dikenal, atau halaman yang memanggil notFound() dari next/navigation
 * untuk data yang memang tidak ada. Next.js mengirim status HTTP 404.
 */
export default function NotFound() {
  return (
    <main className="status-page">
      <section className="card forbidden">
        <span className="forbidden__icon">
          <SearchX strokeWidth={1.75} />
        </span>
        <p className="forbidden__code">404 · Tidak ditemukan</p>
        <h1 className="forbidden__title">Halaman tidak ditemukan</h1>
        <p className="muted">Alamat yang Anda buka tidak ada atau sudah dipindahkan. Periksa kembali tautannya, atau kembali ke Dashboard.</p>
        <div className="btn-row">
          <Link className="btn btn--primary" href="/">
            Kembali ke Dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}
