'use client'

import { useState } from 'react'
import { ErrorBanner, Filters, PageFooter } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { VENUES, useEvents } from '@/data/events'
import { mutate, useQuery } from '@/lib/api'
import Hero from './hero'
import RingkasanSewa from './ringkasansewa'
import JadwalFasilitas from './jadwalfasilitas'
import DaftarSewa from './daftarsewa'
import TinjauSewa from './tinjausewa'

const NONE = []

export default function Sewa() {
  const overlay = useOverlay()
  const events = useEvents()
  const summary = useQuery('/dashboard/summary').data
  const rentalsQ = useQuery('/rentals', { refreshInterval: 30000 })
  const rentals = rentalsQ.data ?? NONE
  const today = summary?.today ?? '2026-10-02'
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [venue, setVenue] = useState('Semua fasilitas')
  const [approval, setApproval] = useState('Semua persetujuan')

  const rows = rentals.filter(
    (r) =>
      (venue === 'Semua fasilitas' || r.venue === venue) &&
      (approval === 'Semua persetujuan' || r.approval === approval) &&
      `${r.id} ${r.applicant}`.toLowerCase().includes(query.toLowerCase()),
  )
  const pendingList = rentals.filter((r) => r.approval === 'Perlu ditinjau')
  const selected = rentals.find((r) => r.id === selectedId) ?? pendingList[0] ?? rows[0]

  /** Formulir pemesanan baru; `prefill` dari slot jadwal yang diklik. */
  const addForm = (prefill: { venue?: string; date?: string } = {}) =>
    overlay.showForm({
      title: 'Tambah pemesanan',
      subtitle: 'Permintaan baru masuk ke antrean tinjauan. Jadwal dicek bentrok dengan acara & sewa lain.',
      success: 'Pemesanan dicatat — menunggu tinjauan',
      fields: [
        { name: 'applicant', label: 'Nama pemesan', placeholder: 'Contoh: Sanggar Mekar Sari', required: true },
        { name: 'venue', label: 'Fasilitas', as: 'select', options: VENUES, defaultValue: prefill.venue },
        { name: 'date', label: 'Tanggal sewa', type: 'date', defaultValue: prefill.date, required: true },
        {
          row: [
            { name: 'start', label: 'Jam mulai', type: 'time', defaultValue: '09:00', required: true },
            { name: 'end', label: 'Jam selesai', type: 'time', defaultValue: '15:00', required: true },
          ],
        },
        { name: 'activity', label: 'Kegiatan', placeholder: 'Contoh: Pentas tari anak · 150 penonton' },
        { name: 'note', label: 'Catatan', placeholder: 'Opsional' },
      ],
      validate: (d) => (d.start && d.end && d.end <= d.start ? { end: 'Jam selesai harus setelah jam mulai.' } : {}),
      onSubmit: async (d) => {
        const created = await mutate('/rentals', { method: 'POST', body: d })
        setSelectedId(created.id)
      },
    })

  return (
    <>
      <Hero onAdd={() => addForm()} />
      <ErrorBanner error={rentalsQ.error} onRetry={rentalsQ.reload} />
      <RingkasanSewa rentals={rentals} pending={pendingList.length} today={today} revenue={summary?.metrics.revenue} />
      <Filters
        search={{ placeholder: 'Cari pemesan atau ID sewa...', value: query, onChange: setQuery }}
        selects={[
          { label: 'Fasilitas', value: venue, onChange: setVenue, options: ['Semua fasilitas', ...VENUES] },
          { label: 'Persetujuan', value: approval, onChange: setApproval, options: ['Semua persetujuan', 'Perlu ditinjau', 'Disetujui', 'Ditolak'] },
        ]}
      />

      <JadwalFasilitas events={events} rentals={rentals} today={today} onBook={addForm} onSelect={setSelectedId} />

      <div className="split">
        <DaftarSewa rows={rows} total={rentals.length} loaded={Boolean(rentalsQ.data)} selectedId={selected?.id} onSelect={setSelectedId} />
        {selected && <TinjauSewa key={selected.id} rental={selected} />}
      </div>

      <PageFooter />
    </>
  )
}
