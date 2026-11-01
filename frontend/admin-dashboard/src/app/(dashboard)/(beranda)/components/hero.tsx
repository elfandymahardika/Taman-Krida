'use client'

import { Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { BolehUbah, TombolUnduhLaporan } from '@/components/akses'
import { useEvents } from '@/data/events'
import { eventForm } from '@/data/eventforms'
import { invalidate } from '@/lib/api'

/** Judul halaman + tombol perbarui, unduh laporan, dan tambah acara. */
export default function Hero({ refreshing }: { refreshing: boolean }) {
  const overlay = useOverlay()
  const events = useEvents()

  return (
    <PageHeader
      title="Dashboard administrator"
      subtitle="Pantau layanan budaya, kelola agenda, dan tindak lanjuti pemesanan."
      actions={
        <>
          <button className="btn" onClick={invalidate} disabled={refreshing} title="Muat ulang semua data">
            <RefreshCw className={refreshing ? 'spin' : ''} strokeWidth={1.75} /> Perbarui
          </button>
          <TombolUnduhLaporan />
          <BolehUbah module="events">
            <button className="btn btn--primary" onClick={() => overlay.showForm(eventForm(events))}>
              <Plus strokeWidth={2} /> Tambah acara
            </button>
          </BolehUbah>
        </>
      }
    />
  )
}
