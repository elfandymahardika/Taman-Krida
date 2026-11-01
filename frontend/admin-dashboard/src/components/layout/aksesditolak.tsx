import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { MODULE_LABEL } from '../../lib/access'
import type { Module } from '../../lib/access'

/** Halaman 403: ditampilkan bila peran pengguna tidak punya akses ke modul halaman ini. */
export default function AksesDitolak({ module, role }: { module?: Module; role?: string }) {
  return (
    <section className="card forbidden" role="alert">
      <span className="forbidden__icon">
        <ShieldX strokeWidth={1.75} />
      </span>
      <p className="forbidden__code">403 · Akses ditolak</p>
      <h1 className="forbidden__title">Anda tidak memiliki akses ke halaman ini</h1>
      <p className="muted">
        Peran <strong>{role ?? '—'}</strong> tidak diizinkan membuka modul <strong>{module ? MODULE_LABEL[module] : 'ini'}</strong>.
        Hubungi Administrator utama bila Anda memerlukan akses.
      </p>
      <Link className="btn btn--primary" href="/">
        Kembali ke Dashboard
      </Link>
    </section>
  )
}
