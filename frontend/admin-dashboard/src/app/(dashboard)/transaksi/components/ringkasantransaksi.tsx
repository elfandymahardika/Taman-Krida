'use client'

import { Clock3, Receipt, ReceiptText, Wallet } from 'lucide-react'
import { Metrics } from '@/components/ui'
import { formatJuta } from '@/data/finance'

/** Kartu metrik: pembayaran diterima, perlu verifikasi, menunggu bayar, dan transaksi bulan ini. */
export default function RingkasanTransaksi({ orders, queue, summary }: { orders: any[]; queue: number; summary: any }) {
  const waiting = orders.filter((o) => o.payment === 'Menunggu bayar')
  const month = summary?.today.slice(0, 7)
  const thisMonth = orders.filter((o) => month && o.createdAt.slice(0, 7) === month)
  const revenue = summary?.metrics.revenue

  return (
    <Metrics
      items={[
        {
          label: 'Pembayaran diterima',
          icon: Wallet,
          value: revenue ? formatJuta(revenue.total) : '—',
          hint: revenue ? `Tiket ${formatJuta(revenue.ticket)} · sewa ${formatJuta(revenue.rental)}` : 'Bulan ini',
        },
        { label: 'Perlu verifikasi', icon: ReceiptText, value: String(queue), hint: 'Bukti transfer menunggu admin keuangan' },
        { label: 'Menunggu bayar', icon: Clock3, value: String(waiting.length), hint: 'Tagihan aktif belum dibayar' },
        {
          label: 'Transaksi bulan ini',
          icon: Receipt,
          value: String(thisMonth.length),
          hint: `${thisMonth.filter((o) => o.type === 'Tiket').length} tiket · ${thisMonth.filter((o) => o.type !== 'Tiket').length} sewa gedung`,
        },
      ]}
    />
  )
}
