'use client'

import { Eye, Save } from 'lucide-react'
import { PageHeader, Period } from '@/components/ui'
import { BolehUbah } from '@/components/akses'
import { useOverlay } from '@/components/overlay'
import { wibDateTime } from '@/data/format'
import type { FormProfil } from './formprofil'

/** Judul halaman + tombol pratinjau dan simpan, serta waktu pembaruan terakhir. */
export default function Hero({ profil: { profileQ, dirty, busy, save } }: { profil: FormProfil }) {
  const overlay = useOverlay()

  return (
    <>
      <PageHeader
        title="Profil & denah"
        subtitle="Perbarui informasi lembaga, fasilitas, dan denah area yang tampil di aplikasi publik."
        actions={
          <>
            <button className="btn" onClick={() => overlay.toast('Tampilan publik ada di aplikasi mobile pengunjung', 'info')}>
              <Eye strokeWidth={1.75} /> Pratinjau publik
            </button>
            <BolehUbah module="info">
              <button className="btn btn--primary" onClick={save} disabled={!dirty || busy}>
                <Save strokeWidth={1.75} /> {busy ? 'Menyimpan…' : 'Simpan perubahan'}
              </button>
            </BolehUbah>
          </>
        }
      />
      <Period
        label={profileQ.data ? `Terakhir diperbarui ${wibDateTime(profileQ.data.updatedAt)}` : 'Memuat profil…'}
        stamp={profileQ.data?.updatedBy ? `Oleh ${profileQ.data.updatedBy} · tersimpan di database backend` : undefined}
      />
    </>
  )
}
