'use client'

import { CalendarDays, Layers, Ticket, Wallet } from 'lucide-react'
import { Metrics } from '@/components/ui'
import { formatJuta } from '@/data/finance'
import type { Event } from '@/data/events'

/** Kartu metrik: tiket terjual, kuota tersisa, pembayaran tiket, dan jumlah acara bertiket. */
export default function RingkasanTiket({ ticketed, revenue }: { ticketed: Event[]; revenue?: { ticket: number; total: number } }) {
  const sold = ticketed.reduce((n, e) => n + (e.sold ?? 0), 0)
  const quota = ticketed.reduce((n, e) => n + e.quota, 0)

  return (
    <Metrics
      items={[
        { label: 'Tiket terjual', icon: Ticket, value: sold.toLocaleString('id-ID'), hint: `Dari ${quota.toLocaleString('id-ID')} tiket untuk ${ticketed.length} acara` },
        { label: 'Kuota tersisa', icon: Layers, value: (quota - sold).toLocaleString('id-ID'), hint: 'Kuota penjualan, bukan kapasitas gedung' },
        {
          label: 'Pembayaran tiket diterima',
          icon: Wallet,
          value: revenue ? formatJuta(revenue.ticket) : '—',
          hint: revenue ? `Bagian dari total ${formatJuta(revenue.total)}` : 'Bulan ini',
        },
        { label: 'Acara dengan tiket', icon: CalendarDays, value: String(ticketed.length), hint: 'Acara dengan kuota tiket' },
      ]}
    />
  )
}
