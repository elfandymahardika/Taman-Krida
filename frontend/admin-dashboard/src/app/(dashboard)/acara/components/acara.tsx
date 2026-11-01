'use client'

import { useMemo, useState } from 'react'
import { Filters, PageFooter } from '@/components/ui'
import { VENUES, sortByDate, useEvents } from '@/data/events'
import { addMonths, monthLabel } from '@/data/format'
import { useQuery } from '@/lib/api'
import Hero from './hero'
import KalenderAcara from './kalenderacara'
import DaftarAcara from './daftaracara'

const ALL_PERIODS = 'Semua periode'

/**
 * Halaman Acara & kalender. Filter status/lokasi/cari hanya untuk daftar acara; filter Periode juga
 * memindahkan kalender ke bulan itu. Kalender selalu menampilkan semua acara di bulan yang tampil.
 */
export default function Acara() {
  const events = useEvents()
  // "Hari ini" pada data contoh dari server (APP_TODAY), sama dengan dashboard.
  const today: string = useQuery('/dashboard/summary').data?.today ?? '2026-10-02'
  // null = ikuti hari ini (sampai pengguna memilih bulan/tanggal lain).
  const [month, setMonth] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState(ALL_PERIODS)
  const [status, setStatus] = useState('Semua status')
  const [venue, setVenue] = useState('Semua lokasi')
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => sortByDate(events), [events])
  const months = useMemo(() => [...new Set(sorted.map((e) => e.date.slice(0, 7)))], [sorted])
  const published = events.filter((e) => e.status === 'Terpublikasi').length
  const drafts = events.length - published
  const shownMonth = month ?? today.slice(0, 7)
  const shownDate = selectedDate ?? today

  const filtered = sorted.filter(
    (e) =>
      (period === ALL_PERIODS || monthLabel(e.date.slice(0, 7)) === period) &&
      (status === 'Semua status' || e.status === status) &&
      (venue === 'Semua lokasi' || e.venue === venue) &&
      `${e.name} ${e.organizer}`.toLowerCase().includes(query.trim().toLowerCase()),
  )

  const resetFilters = (fn: (v: string) => void) => (v: string) => {
    fn(v)
    setPage(0)
  }

  /** Tampilkan bulan `ym` di kalender; tanggal terpilih = acara pertama di bulan itu (atau tanggal 1). */
  const showMonth = (ym: string) => {
    setMonth(ym)
    setSelectedDate(sorted.find((e) => e.date.startsWith(ym))?.date ?? `${ym}-01`)
  }

  const choosePeriod = (label: string) => {
    resetFilters(setPeriod)(label)
    const ym = months.find((m) => monthLabel(m) === label)
    if (ym) showMonth(ym)
  }

  return (
    <>
      <Hero />
      <Filters
        search={{ placeholder: 'Cari acara atau komunitas...', value: query, onChange: resetFilters(setQuery) }}
        selects={[
          { label: 'Periode', value: period, onChange: choosePeriod, options: [ALL_PERIODS, ...months.map(monthLabel)] },
          { label: 'Status', value: status, onChange: resetFilters(setStatus), options: ['Semua status', 'Terpublikasi', 'Draf'] },
          { label: 'Lokasi', value: venue, onChange: resetFilters(setVenue), options: ['Semua lokasi', ...VENUES] },
        ]}
      />
      <KalenderAcara
        events={sorted}
        month={shownMonth}
        selectedDate={shownDate}
        today={today}
        onSelectDate={setSelectedDate}
        onShiftMonth={(delta) => showMonth(addMonths(shownMonth, delta))}
        onToday={() => {
          setMonth(null)
          setSelectedDate(null)
        }}
        published={published}
        drafts={drafts}
      />
      <DaftarAcara events={filtered} page={page} onPage={setPage} published={published} drafts={drafts} />
      <PageFooter />
    </>
  )
}
