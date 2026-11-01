'use client'

import { SlidersHorizontal } from 'lucide-react'
import { PageHeader, Period } from '@/components/ui'
import { BolehUbah, TombolUnduhLaporan } from '@/components/akses'

/** Judul halaman + tombol unduh laporan dan atur inventori tiket. */
export default function Hero({ canEdit, onInventory }: { canEdit: boolean; onInventory: () => void }) {
  return (
    <>
      <PageHeader
        title="Tiket pertunjukan"
        subtitle="Pantau kuota, penjualan, pesanan, dan penerbitan tiket untuk setiap pertunjukan."
        actions={
          <>
            <TombolUnduhLaporan />
            <BolehUbah module="events">
              <button className="btn btn--primary" disabled={!canEdit} onClick={onInventory}>
                <SlidersHorizontal strokeWidth={1.75} /> Atur inventori tiket
              </button>
            </BolehUbah>
          </>
        }
      />
      <Period />
    </>
  )
}
