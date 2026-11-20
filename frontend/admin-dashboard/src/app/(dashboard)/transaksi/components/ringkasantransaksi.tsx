'use client'

import { Clock3, Receipt, ReceiptText, Wallet } from 'lucide-react'
import { Metrics } from '@/components/ui'
import { formatJuta } from '@/data/finance'

/** Angka dari GET /orders/stats (dihitung di database atas SEMUA transaksi, bukan hanya halaman yang tampil). */
type Stats = { verify: number; waiting: number; month: { key: string; ticket: number; rental: number } }

/** Kartu metrik: pembayaran diterima, perlu verifikasi, menunggu bayar, dan transaksi bulan ini. */
export default function RingkasanTransaksi({ stats, summary }: { stats?: Stats; summary: any }) {
  const revenue = summary?.metrics.revenue
  const value = (n?: number) => (n === undefined ? '—' : String(n))

  return (
    <Metrics
      items={[
        {
          label: 'Pembayaran diterima',
          icon: Wallet,
          value: revenue ? formatJuta(revenue.total) : '—',
          hint: revenue ? `Tiket ${formatJuta(revenue.ticket)} · sewa ${formatJuta(revenue.rental)}` : 'Bulan ini',
        },
        { label: 'Perlu verifikasi', icon: ReceiptText, value: value(stats?.verify), hint: 'Bukti transfer menunggu admin keuangan' },
        { label: 'Menunggu bayar', icon: Clock3, value: value(stats?.waiting), hint: 'Tagihan aktif belum dibayar' },
        {
          label: 'Transaksi bulan ini',
          icon: Receipt,
          value: stats ? String(stats.month.ticket + stats.month.rental) : '—',
          hint: stats ? `${stats.month.ticket} tiket · ${stats.month.rental} sewa gedung` : 'Memuat…',
        },
      ]}
    />
  )
}
