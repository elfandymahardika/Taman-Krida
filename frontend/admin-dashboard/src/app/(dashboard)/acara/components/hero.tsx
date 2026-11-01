'use client'

import { Plus } from 'lucide-react'
import { PageHeader, Period } from '@/components/ui'
import { BolehUbah, TombolUnduhLaporan } from '@/components/akses'
import { useAksiAcara } from './aksiacara'

/** Judul halaman + tombol unduh laporan dan tambah acara. */
export default function Hero() {
  const { openAdd } = useAksiAcara()

  return (
    <>
      <PageHeader
        title="Acara & kalender"
        subtitle="Atur agenda budaya, jadwal fasilitas, dan publikasi acara dalam satu kalender."
        actions={
          <>
            <TombolUnduhLaporan />
            <BolehUbah module="events">
              <button className="btn btn--primary" onClick={openAdd}>
                <Plus strokeWidth={2} /> Tambah acara
              </button>
            </BolehUbah>
          </>
        }
      />
      <Period />
    </>
  )
}
