'use client'

import { Plus } from 'lucide-react'
import { PageHeader, Period } from '@/components/ui'
import { BolehUbah, TombolUnduhLaporan } from '@/components/akses'

/** Judul halaman + tombol unduh laporan dan catat pembayaran. */
export default function Hero({ onRecord }: { onRecord: () => void }) {
  return (
    <>
      <PageHeader
        title="Transaksi & pembayaran"
        subtitle="Pantau pembayaran tiket dan sewa gedung, lalu verifikasi bukti transfer yang masuk."
        actions={
          <>
            <TombolUnduhLaporan />
            <BolehUbah module="payments">
              <button className="btn btn--primary" onClick={onRecord}>
                <Plus strokeWidth={2} /> Catat pembayaran
              </button>
            </BolehUbah>
          </>
        }
      />
      <Period />
    </>
  )
}
