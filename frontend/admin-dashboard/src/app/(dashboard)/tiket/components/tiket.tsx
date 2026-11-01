'use client'

import { useState } from 'react'
import { ErrorBanner, Filters, PageFooter, Select } from '@/components/ui'
import { sortByDate, useEvents } from '@/data/events'
import { monthLabel } from '@/data/format'
import { useQuery } from '@/lib/api'
import { useAksiTiket } from './aksitiket'
import Hero from './hero'
import RingkasanTiket from './ringkasantiket'
import InventoriTiket from './inventoritiket'
import DaftarPesanan from './daftarpesanan'
import DetailPesanan from './detailpesanan'

const NONE = []

export default function Tiket() {
  const summary = useQuery('/dashboard/summary').data
  const ordersQ = useQuery('/orders?type=Tiket', { refreshInterval: 30000 })
  const orders = ordersQ.data ?? NONE
  const allTicketed = sortByDate(useEvents()).filter((e) => e.quota !== undefined)
  // Inventori per bulan; bawaan bulan berjalan pada data contoh (dari server).
  const [pickedMonth, setPickedMonth] = useState<string | null>(null)
  const month = pickedMonth ?? summary?.today.slice(0, 7) ?? '2026-10'
  const months = [...new Set([month, ...allTicketed.map((e) => e.date.slice(0, 7))])].sort()
  const ticketed = allTicketed.filter((e) => e.date.startsWith(month))
  const { openInventory, verify } = useAksiTiket(ticketed)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('Semua acara')
  const [payFilter, setPayFilter] = useState('Semua pembayaran')
  const [ticketFilter, setTicketFilter] = useState('Semua status tiket')

  const rows = orders.filter(
    (o) =>
      (eventFilter === 'Semua acara' || o.service === eventFilter) &&
      (payFilter === 'Semua pembayaran' || o.payment === payFilter) &&
      (ticketFilter === 'Semua status tiket' || o.ticket.status === ticketFilter) &&
      `${o.id} ${o.customer}`.toLowerCase().includes(query.toLowerCase()),
  )
  const selected = orders.find((o) => o.id === selectedId) ?? rows[0]

  return (
    <>
      <Hero canEdit={ticketed.length > 0} onInventory={() => openInventory()} />
      <ErrorBanner error={ordersQ.error} onRetry={ordersQ.reload} />
      <div className="filters">
        <Select
          label="Periode inventori"
          value={monthLabel(month)}
          onChange={(label) => setPickedMonth(months.find((m) => monthLabel(m) === label) ?? null)}
          options={months.map(monthLabel)}
        />
      </div>
      <RingkasanTiket ticketed={ticketed} revenue={summary?.metrics.revenue} />
      <InventoriTiket ticketed={ticketed} onEdit={openInventory} />

      <Filters
        search={{ placeholder: 'Cari ID pesanan atau pemesan...', value: query, onChange: setQuery }}
        selects={[
          { label: 'Acara', value: eventFilter, onChange: setEventFilter, options: ['Semua acara', ...new Set<string>(orders.map((o) => o.service))] },
          { label: 'Pembayaran', value: payFilter, onChange: setPayFilter, options: ['Semua pembayaran', 'Lunas', 'Perlu verifikasi', 'Menunggu bayar'] },
          { label: 'Status tiket', value: ticketFilter, onChange: setTicketFilter, options: ['Semua status tiket', 'Tiket aktif', 'Belum terbit'] },
        ]}
      />

      <div className="split">
        <DaftarPesanan
          rows={rows}
          total={orders.length}
          loaded={Boolean(ordersQ.data)}
          selectedId={selected?.id}
          onSelect={(o) => {
            setSelectedId(o.id)
            if (o.payment === 'Perlu verifikasi') verify(o)
          }}
        />
        {selected && <DetailPesanan order={selected} onVerify={verify} />}
      </div>

      <PageFooter />
    </>
  )
}
