'use client'

import { useState } from 'react'
import { ErrorBanner, Filters, PageFooter } from '@/components/ui'
import { type Paginated, useDebouncedValue, useQuery, withQuery } from '@/lib/api'
import { METHODS, useAksiTransaksi } from './aksitransaksi'
import Hero from './hero'
import RingkasanTransaksi from './ringkasantransaksi'
import DaftarPembayaran, { PAGE_SIZE } from './daftarpembayaran'
import AntreanVerifikasi from './antreanverifikasi'
import VerifikasiPembayaran, { VerifikasiKosong } from './verifikasipembayaran'

const NONE = []
const REFRESH_MS = 30000
const ALL_TYPES = 'Semua jenis'
const ALL_STATUS = 'Semua status'
const ALL_METHODS = 'Semua metode'

export default function Transaksi() {
  const { recordPayment, showOrder } = useAksiTransaksi()
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [type, setType] = useState(ALL_TYPES)
  const [status, setStatus] = useState(ALL_STATUS)
  const [method, setMethod] = useState(ALL_METHODS)
  const [page, setPage] = useState(0)
  // Halaman yang diminta tidak boleh melewati halaman terakhir yang diketahui (mis. data berkurang setelah verifikasi).
  const [lastPage, setLastPage] = useState(Infinity)
  const shownPage = Math.min(page, lastPage)
  const q = useDebouncedValue(query.trim())

  // Paginasi & filter dikerjakan backend (LIMIT/OFFSET di MySQL): browser hanya menerima 10 baris per halaman,
  // bukan seluruh riwayat transaksi. `keepPrevious` menahan baris lama saat pindah halaman agar tabel tidak berkedip.
  const ordersQ = useQuery<Paginated<any>>(
    withQuery('/orders', {
      page: shownPage + 1,
      limit: PAGE_SIZE,
      q,
      type: type !== ALL_TYPES && type,
      payment: status !== ALL_STATUS && status,
      method: method !== ALL_METHODS && method.split(' ')[0],
    }),
    { refreshInterval: REFRESH_MS, keepPrevious: true },
  )
  // Antrean verifikasi dimuat terpisah (biasanya sedikit) agar tetap lengkap apa pun halaman/filter tabelnya.
  const queueQ = useQuery<any[]>(withQuery('/orders', { payment: 'Perlu verifikasi', limit: 100 }), { refreshInterval: REFRESH_MS })
  const statsQ = useQuery('/orders/stats', { refreshInterval: REFRESH_MS })
  const summary = useQuery('/dashboard/summary').data

  const rows = ordersQ.data?.data ?? NONE
  const pagination = ordersQ.data?.pagination
  if (pagination && pagination.totalPages - 1 !== lastPage) setLastPage(pagination.totalPages - 1)
  const queue = queueQ.data ?? NONE
  // Transaksi terpilih (yang punya bukti transfer), atau antrean verifikasi teratas.
  const selected = rows.find((o) => o.id === selectedId && o.proof) ?? queue.find((o) => o.id === selectedId) ?? queue[0]

  // Data berkurang (mis. setelah verifikasi) sehingga halaman aktif melewati halaman terakhir → mundur ke halaman terakhir.

  const filter = (fn: (v: string) => void) => (v: string) => {
    fn(v)
    setPage(0)
  }

  return (
    <>
      <Hero onRecord={() => recordPayment()} />
      <ErrorBanner error={ordersQ.error ?? queueQ.error} onRetry={() => (ordersQ.reload(), queueQ.reload())} />
      <RingkasanTransaksi stats={statsQ.data} summary={summary} />
      <Filters
        search={{ placeholder: 'Cari nomor transaksi atau pemesan...', value: query, onChange: filter(setQuery) }}
        selects={[
          { label: 'Jenis', value: type, onChange: filter(setType), options: [ALL_TYPES, 'Tiket', 'Sewa gedung'] },
          { label: 'Status', value: status, onChange: filter(setStatus), options: [ALL_STATUS, 'Lunas', 'Perlu verifikasi', 'Menunggu bayar'] },
          { label: 'Metode', value: method, onChange: filter(setMethod), options: [ALL_METHODS, ...METHODS] },
        ]}
      />

      <div className="split">
        <div className="stack">
          <DaftarPembayaran
            rows={rows}
            pagination={pagination}
            loading={!ordersQ.data || ordersQ.stale}
            page={shownPage}
            onPage={setPage}
            selectedId={selected?.id}
            onRowClick={(o) => (o.proof ? setSelectedId(o.id) : showOrder(o))}
          />
          <AntreanVerifikasi queue={queue} selectedId={selected?.id} onSelect={setSelectedId} />
        </div>

        {selected?.proof ? <VerifikasiPembayaran key={selected.id} order={selected} /> : queueQ.data && <VerifikasiKosong />}
      </div>

      <PageFooter />
    </>
  )
}
