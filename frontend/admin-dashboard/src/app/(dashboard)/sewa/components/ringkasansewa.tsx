'use client'

import { Building2, CheckCircle, Clock3, Wallet } from 'lucide-react'
import { Metrics } from '@/components/ui'
import { formatJuta } from '@/data/finance'

type Props = {
  rentals: any[]
  pending: number
  /** Tanggal "hari ini" (YYYY-MM-DD) untuk menentukan bulan berjalan. */
  today: string
  revenue?: { rental: number; total: number }
}

/** Kartu metrik: pemesanan bulan ini, disetujui, perlu ditinjau, dan pembayaran sewa. */
export default function RingkasanSewa({ rentals, pending, today, revenue }: Props) {
  const month = today.slice(0, 7)
  const monthRentals = rentals.filter((r) => r.date.startsWith(month))

  return (
    <Metrics
      items={[
        { label: 'Pemesanan bulan ini', icon: Building2, value: String(monthRentals.length), hint: 'Seluruh permintaan bulan ini' },
        { label: 'Disetujui', icon: CheckCircle, value: String(monthRentals.filter((r) => r.approval === 'Disetujui').length), hint: 'Tagihan sewa otomatis dibuat' },
        { label: 'Perlu ditinjau', icon: Clock3, value: String(pending), hint: 'Menunggu keputusan admin' },
        {
          label: 'Pembayaran sewa diterima',
          icon: Wallet,
          value: revenue ? formatJuta(revenue.rental) : '—',
          hint: revenue ? `Bagian dari total ${formatJuta(revenue.total)}` : 'Bulan ini',
        },
      ]}
    />
  )
}
