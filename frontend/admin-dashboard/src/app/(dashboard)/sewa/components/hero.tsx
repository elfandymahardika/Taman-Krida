'use client'

import { Plus } from 'lucide-react'
import { PageHeader, Period } from '@/components/ui'
import { BolehUbah, TombolUnduhLaporan } from '@/components/akses'

/** Judul halaman + tombol unduh laporan dan tambah pemesanan. */
export default function Hero({ onAdd }: { onAdd: () => void }) {
  return (
    <>
      <PageHeader
        title="Sewa gedung"
        subtitle="Kelola ketersediaan fasilitas dan tinjau permintaan penggunaan ruang budaya."
        actions={
          <>
            <TombolUnduhLaporan />
            <BolehUbah module="rentals">
              <button className="btn btn--primary" onClick={onAdd}>
                <Plus strokeWidth={2} /> Tambah pemesanan
              </button>
            </BolehUbah>
          </>
        }
      />
      <Period />
    </>
  )
}
