'use client'

import { useMemo, useState } from 'react'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge, Card, Cell, DataTable, DetailRow, Filters, PageFooter, PageHeader, Period, Photo, TableFoot } from '../components/ui'
import { useDownloadReport, useOverlay } from '../components/overlay'
import { PHOTOS } from '../data/sample'
import { VENUES, eventStore, formatDate, formatTime, octDay, sortByDate, timeRange, useEvents } from '../data/events'
import { eventDetail, eventForm } from './shared'

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const PAGE_SIZE = 6

// Oktober 2026 dimulai hari Kamis → 3 tanggal September di awal pekan pertama.
const CELLS = [
  ...[28, 29, 30].map((d) => ({ day: d, outside: true })),
  ...Array.from({ length: 31 }, (_, i) => ({ day: i + 1 })),
  { day: 1, outside: true },
]
const WEEKS = Array.from({ length: CELLS.length / 7 }, (_, w) => CELLS.slice(w * 7, w * 7 + 7))

export default function Acara() {
  const overlay = useOverlay()
  const download = useDownloadReport()
  const events = useEvents()
  const [selectedDay, setSelectedDay] = useState(2)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Semua status')
  const [venue, setVenue] = useState('Semua lokasi')
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => sortByDate(events), [events])
  const published = events.filter((e) => e.status === 'Terpublikasi').length
  const drafts = events.length - published

  const filtered = sorted.filter(
    (e) =>
      (status === 'Semua status' || e.status === status) &&
      (venue === 'Semua lokasi' || e.venue === venue) &&
      `${e.name} ${e.organizer}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const selectedEvent = sorted.find((e) => octDay(e) === selectedDay)
  const dayIndex = CELLS.findIndex((c) => !c.outside && c.day === selectedDay) % 7

  const openAdd = () => overlay.showForm(eventForm(events))
  const openEdit = (e) => overlay.showForm(eventForm(events, e))
  const toggleStatus = (e) => {
    const next = e.status === 'Draf' ? 'Terpublikasi' : 'Draf'
    eventStore.setStatus(e.id, next)
    overlay.toast(next === 'Draf' ? 'Publikasi acara ditarik' : 'Acara diterbitkan')
  }
  const confirmDelete = (e) =>
    overlay.showDetail({
      title: 'Hapus acara?',
      subtitle: e.name,
      rows: [
        ['Tanggal', `${formatDate(e)} · ${timeRange(e)}`],
        ['Lokasi', e.venue],
        ['Catatan', 'Data yang dihapus tidak dapat dikembalikan.'],
      ],
      primaryLabel: 'Hapus',
      success: 'Acara berhasil dihapus',
      onPrimary: () => eventStore.remove(e.id),
    })

  const resetFilters = (fn) => (v) => {
    fn(v)
    setPage(0)
  }

  return (
    <>
      <PageHeader
        title="Acara & kalender"
        subtitle="Atur agenda budaya, jadwal fasilitas, dan publikasi acara dalam satu kalender."
        actions={
          <>
            <button className="btn" onClick={download}>
              <Download strokeWidth={1.75} /> Unduh laporan
            </button>
            <button className="btn btn--primary" onClick={openAdd}>
              <Plus strokeWidth={2} /> Tambah acara
            </button>
          </>
        }
      />
      <Period />
      <Filters
        search={{ placeholder: 'Cari acara atau komunitas...', value: query, onChange: resetFilters(setQuery) }}
        selects={[
          { label: 'Periode', options: ['1–31 Oktober 2026'] },
          { label: 'Status', value: status, onChange: resetFilters(setStatus), options: ['Semua status', 'Terpublikasi', 'Draf'] },
          { label: 'Lokasi', value: venue, onChange: resetFilters(setVenue), options: ['Semua lokasi', ...VENUES] },
        ]}
      />

      <div className="split">
        <Card
          title="Kalender acara"
          subtitle={`Oktober 2026 · ${events.filter(octDay).length} acara`}
          action={
            <div className="pager" style={{ fontWeight: 600, fontSize: 12 }}>
              <button aria-label="Bulan sebelumnya" onClick={() => overlay.toast('Contoh prototype: menampilkan halaman/tanggal berikutnya')}>
                ‹
              </button>
              <button onClick={() => setSelectedDay(2)}>Hari ini</button>
              <button aria-label="Bulan berikutnya" onClick={() => overlay.toast('Contoh prototype: menampilkan halaman/tanggal berikutnya')}>
                ›
              </button>
            </div>
          }
        >
          <div className="table-wrap">
            <div style={{ minWidth: 560 }}>
              <div className="weekdays" style={{ marginBottom: 17 }}>
                {WEEKDAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              {WEEKS.map((week, w) => (
                <div className="week" key={w}>
                  {week.map((c) => {
                    const dayEvents = c.outside ? [] : sorted.filter((e) => octDay(e) === c.day)
                    const selected = !c.outside && c.day === selectedDay
                    return (
                      <div
                        key={`${w}-${c.day}`}
                        className={`day ${c.outside ? 'is-outside' : ''} ${selected ? 'is-selected' : ''}`}
                        onClick={() => !c.outside && setSelectedDay(c.day)}
                        role={c.outside ? undefined : 'button'}
                        tabIndex={c.outside ? undefined : 0}
                        onKeyDown={(ev) => ev.key === 'Enter' && !c.outside && setSelectedDay(c.day)}
                        aria-label={c.outside ? undefined : `${c.day} Oktober`}
                      >
                        <span className="day__num">{c.day}</span>
                        {dayEvents.map((e) => (
                          <button
                            key={e.id}
                            className={`day__event ${e.status === 'Draf' ? 'is-draft' : ''}`}
                            onClick={(ev) => {
                              ev.stopPropagation()
                              setSelectedDay(c.day)
                              overlay.showDetail(eventDetail(e))
                            }}
                          >
                            {formatTime(e.start)} {e.short}
                            {e.status === 'Draf' && ' · Draf'}
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <p className="muted" style={{ fontSize: 10, lineHeight: 1.5 }}>
            {published} terpublikasi · {drafts} draf · Tanggal terpilih: {DAY_NAMES[dayIndex]}, {selectedDay} Oktober
          </p>
        </Card>

        <Card title="Agenda terpilih" subtitle={`${DAY_NAMES[dayIndex]}, ${selectedDay} Oktober 2026`}>
          {selectedEvent ? (
            <>
              {selectedEvent.photo && <Photo {...PHOTOS[selectedEvent.photo]} width="100%" height={148} />}
              <div>
                <Badge>{selectedEvent.status}</Badge>
              </div>
              <p style={{ fontSize: 17, lineHeight: 1.5 }}>{selectedEvent.name}</p>
              <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                {selectedEvent.organizer}
              </p>
              <div>
                <DetailRow label="Waktu">{timeRange(selectedEvent)}</DetailRow>
                <DetailRow label="Lokasi">{selectedEvent.venue}</DetailRow>
                <DetailRow label="Penjualan">
                  {selectedEvent.quota !== undefined
                    ? `${selectedEvent.sold ?? 0} / ${selectedEvent.quota} tiket`
                    : 'Tanpa tiket berbayar'}
                </DetailRow>
              </div>
              <div className="btn-row">
                <button className="btn btn--primary" onClick={() => openEdit(selectedEvent)}>
                  Edit acara
                </button>
                <button className="btn" onClick={() => toggleStatus(selectedEvent)}>
                  {selectedEvent.status === 'Draf' ? 'Terbitkan' : 'Tarik publikasi'}
                </button>
                <button className="btn btn--danger" onClick={() => confirmDelete(selectedEvent)}>
                  Hapus
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                Tidak ada agenda pada tanggal ini.
              </p>
              <div>
                <button className="btn btn--primary" onClick={openAdd}>
                  <Plus strokeWidth={2} /> Tambah acara
                </button>
              </div>
            </>
          )}
        </Card>
      </div>

      <Card
        title="Daftar acara"
        subtitle="Kelola detail dan status publikasi agenda. Perubahan tersimpan di browser (localStorage)."
        action={
          <p className="link" style={{ textDecoration: 'none' }}>
            {published} terpublikasi · {drafts} draf
          </p>
        }
      >
        <DataTable
          columns={[
            { label: 'Acara / penyelenggara', width: 300, render: (e) => <Cell main={e.name} sub={e.organizer} /> },
            { label: 'Tanggal & waktu', width: 160, render: (e) => <Cell main={formatDate(e)} sub={timeRange(e)} /> },
            { label: 'Lokasi', width: 190, render: (e) => <p>{e.venue}</p> },
            { label: 'Publikasi', width: 110, render: (e) => <Badge>{e.status}</Badge> },
            {
              label: 'Aksi',
              width: 260,
              render: (e) => (
                <div className="row-actions">
                  <button className="pill" onClick={() => openEdit(e)}>
                    <Pencil strokeWidth={1.75} /> Edit
                  </button>
                  <button className="pill" onClick={() => toggleStatus(e)}>
                    {e.status === 'Draf' ? 'Terbitkan' : 'Tarik'}
                  </button>
                  <button className="pill pill--danger" onClick={() => confirmDelete(e)}>
                    <Trash2 strokeWidth={1.75} /> Hapus
                  </button>
                </div>
              ),
            },
          ]}
          rows={pageRows}
          getKey={(e) => e.id}
          footer={
            <>
              {!filtered.length && (
                <p className="muted" style={{ padding: '24px 12px', textAlign: 'center' }}>
                  Tidak ada acara yang cocok dengan pencarian atau filter.
                </p>
              )}
              <TableFoot page={safePage} pages={pages} onPage={setPage}>
                Menampilkan {pageRows.length} dari {filtered.length} acara ·{' '}
                <button
                  className="link link--sm"
                  onClick={() => {
                    eventStore.reset()
                    overlay.toast('Data contoh acara dipulihkan')
                  }}
                >
                  Pulihkan data contoh
                </button>
              </TableFoot>
            </>
          }
        />
      </Card>

      <PageFooter />
    </>
  )
}
