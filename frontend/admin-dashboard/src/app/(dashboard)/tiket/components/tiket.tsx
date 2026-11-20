'use client'

import { useState } from 'react'
import { ErrorBanner, Filters, PageFooter, Select } from '@/components/ui'
import { sortByDate, useEvents } from '@/data/events'
import { monthLabel, shortDate, todayWib } from '@/data/format'
import { type Paginated, useDebouncedValue, useQuery, withQuery } from '@/lib/api'
import { useAksiTiket } from './aksitiket'
import Hero from './hero'
import RingkasanTiket from './ringkasantiket'
import InventoriTiket from './inventoritiket'
import DaftarPesanan, { PAGE_SIZE } from './daftarpesanan'
import DetailPesanan from './detailpesanan'

const NONE = []
const ALL_EVENTS = 'Semua acara'
const ALL_PAYMENTS = 'Semua pembayaran'
const ALL_TICKETS = 'Semua status tiket'
/** Label filter status tiket → parameter backend `ticket`. */
const TICKET_PARAM = { 'Tiket aktif': 'aktif', 'Belum terbit': 'belum' }

export default function Tiket() {
  const summary = useQuery('/dashboard/summary').data
  const allTicketed = sortByDate(useEvents()).filter((e) => e.quota !== undefined)
  // Inventori per bulan; bawaan bulan berjalan pada data contoh (dari server).
  const [pickedMonth, setPickedMonth] = useState<string | null>(null)
  const month = pickedMonth ?? summary?.today.slice(0, 7) ?? todayWib().slice(0, 7)
  const months = [...new Set([month, ...allTicketed.map((e) => e.date.slice(0, 7))])].sort()
  const ticketed = allTicketed.filter((e) => e.date.startsWith(month))
  const { openInventory, verify } = useAksiTiket(ticketed)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState(ALL_EVENTS)
  const [payFilter, setPayFilter] = useState(ALL_PAYMENTS)
  const [ticketFilter, setTicketFilter] = useState(ALL_TICKETS)
  const [page, setPage] = useState(0)
  // Halaman yang diminta tidak boleh melewati halaman terakhir yang diketahui (mis. data berkurang setelah verifikasi).
  const [lastPage, setLastPage] = useState(Infinity)
  const shownPage = Math.min(page, lastPage)
  const q = useDebouncedValue(query.trim())

  // Pilihan filter acara dari daftar acara bertiket; nama kembar diberi tanggal agar bisa dibedakan.
  const eventOptions = allTicketed.map((e) => ({
    id: e.id,
    label: allTicketed.filter((x) => x.name === e.name).length > 1 ? `${e.name} (${shortDate(e.date)})` : e.name,
  }))
  const eventId = eventOptions.find((e) => e.label === eventFilter)?.id

  // Paginasi & filter di backend (LIMIT/OFFSET MySQL); browser hanya menerima satu halaman pesanan.
  const ordersQ = useQuery<Paginated<any>>(
    withQuery('/orders', {
      type: 'Tiket',
      page: shownPage + 1,
      limit: PAGE_SIZE,
      q,
      eventId,
      payment: payFilter !== ALL_PAYMENTS && payFilter,
      ticket: TICKET_PARAM[ticketFilter],
    }),
    { refreshInterval: 30000, keepPrevious: true },
  )
  const rows = ordersQ.data?.data ?? NONE
  const pagination = ordersQ.data?.pagination
  if (pagination && pagination.totalPages - 1 !== lastPage) setLastPage(pagination.totalPages - 1)
  const selected = rows.find((o) => o.id === selectedId) ?? rows[0]


  const filter = (fn: (v: string) => void) => (v: string) => {
    fn(v)
    setPage(0)
  }

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
        search={{ placeholder: 'Cari ID pesanan atau pemesan...', value: query, onChange: filter(setQuery) }}
        selects={[
          { label: 'Acara', value: eventFilter, onChange: filter(setEventFilter), options: [ALL_EVENTS, ...eventOptions.map((e) => e.label)] },
          { label: 'Pembayaran', value: payFilter, onChange: filter(setPayFilter), options: [ALL_PAYMENTS, 'Lunas', 'Perlu verifikasi', 'Menunggu bayar'] },
          { label: 'Status tiket', value: ticketFilter, onChange: filter(setTicketFilter), options: [ALL_TICKETS, ...Object.keys(TICKET_PARAM)] },
        ]}
      />

      <div className="split">
        <DaftarPesanan
          rows={rows}
          pagination={pagination}
          loading={!ordersQ.data || ordersQ.stale}
          page={shownPage}
          onPage={setPage}
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
