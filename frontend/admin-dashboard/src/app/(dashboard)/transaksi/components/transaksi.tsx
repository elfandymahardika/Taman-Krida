'use client'

import { useState } from 'react'
import { ErrorBanner, Filters, PageFooter } from '@/components/ui'
import { useQuery } from '@/lib/api'
import { METHODS, useAksiTransaksi } from './aksitransaksi'
import Hero from './hero'
import RingkasanTransaksi from './ringkasantransaksi'
import DaftarPembayaran from './daftarpembayaran'
import AntreanVerifikasi from './antreanverifikasi'
import VerifikasiPembayaran, { VerifikasiKosong } from './verifikasipembayaran'

const NONE = []

export default function Transaksi() {
  const { recordPayment, showOrder } = useAksiTransaksi()
  const ordersQ = useQuery('/orders', { refreshInterval: 30000 })
  const summary = useQuery('/dashboard/summary').data
  const orders = ordersQ.data ?? NONE
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('Semua jenis')
  const [status, setStatus] = useState('Semua status')
  const [method, setMethod] = useState('Semua metode')
  const [page, setPage] = useState(0)

  const rows = orders.filter(
    (o) =>
      (type === 'Semua jenis' || o.type === type) &&
      (status === 'Semua status' || o.payment === status) &&
      (method === 'Semua metode' || (o.method ?? '').startsWith(method.split(' ')[0])) &&
      `${o.id} ${o.customer}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const queue = orders.filter((o) => o.payment === 'Perlu verifikasi')
  // Transaksi terpilih (yang punya bukti transfer), atau antrean verifikasi teratas.
  const selected = orders.find((o) => o.id === selectedId && o.proof) ?? queue[0]
  const filter = (fn: (v: string) => void) => (v: string) => {
    fn(v)
    setPage(0)
  }

  return (
    <>
      <Hero onRecord={() => recordPayment()} />
      <ErrorBanner error={ordersQ.error} onRetry={ordersQ.reload} />
      <RingkasanTransaksi orders={orders} queue={queue.length} summary={summary} />
      <Filters
        search={{ placeholder: 'Cari nomor transaksi atau pemesan...', value: query, onChange: filter(setQuery) }}
        selects={[
          { label: 'Jenis', value: type, onChange: filter(setType), options: ['Semua jenis', 'Tiket', 'Sewa gedung'] },
          { label: 'Status', value: status, onChange: filter(setStatus), options: ['Semua status', 'Lunas', 'Perlu verifikasi', 'Menunggu bayar'] },
          { label: 'Metode', value: method, onChange: filter(setMethod), options: ['Semua metode', ...METHODS] },
        ]}
      />

      <div className="split">
        <div className="stack">
          <DaftarPembayaran
            rows={rows}
            loaded={Boolean(ordersQ.data)}
            page={page}
            onPage={setPage}
            selectedId={selected?.id}
            onRowClick={(o) => (o.proof ? setSelectedId(o.id) : showOrder(o))}
          />
          <AntreanVerifikasi queue={queue} selectedId={selected?.id} onSelect={setSelectedId} />
        </div>

        {selected?.proof ? <VerifikasiPembayaran key={selected.id} order={selected} /> : ordersQ.data && <VerifikasiKosong />}
      </div>

      <PageFooter />
    </>
  )
}
