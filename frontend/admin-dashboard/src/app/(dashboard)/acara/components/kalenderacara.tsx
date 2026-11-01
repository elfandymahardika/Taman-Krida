'use client'

import { Plus } from 'lucide-react'
import { Badge, Card, DetailRow, Photo } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { PHOTOS } from '@/data/sample'
import { formatTime, timeRange } from '@/data/events'
import type { Event } from '@/data/events'
import { eventDetail } from '@/data/eventforms'
import { longDate, monthGrid, monthLabel } from '@/data/format'
import { useAksiAcara } from './aksiacara'

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

type Props = {
  /** Semua acara, terurut tanggal (tidak terpengaruh filter). */
  events: Event[]
  /** Bulan yang tampil, "YYYY-MM". */
  month: string
  /** Tanggal terpilih, "YYYY-MM-DD". */
  selectedDate: string
  /** "Hari ini" pada data contoh (dari server). */
  today: string
  onSelectDate: (date: string) => void
  /** Geser bulan: -1 sebelumnya, +1 berikutnya. */
  onShiftMonth: (delta: number) => void
  onToday: () => void
  published: number
  drafts: number
}

/** Kalender satu bulan (bisa digeser) + kartu agenda pada tanggal terpilih. */
export default function KalenderAcara({ events, month, selectedDate, today, onSelectDate, onShiftMonth, onToday, published, drafts }: Props) {
  const overlay = useOverlay()
  const cells = monthGrid(month)
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
  const monthEvents = events.filter((e) => e.date.startsWith(month))
  const selectedEvent = events.find((e) => e.date === selectedDate)

  return (
    <div className="split">
      <Card
        title="Kalender acara"
        subtitle={`${monthLabel(month)} · ${monthEvents.length} acara`}
        action={
          <div className="pager" style={{ fontWeight: 600, fontSize: 12 }}>
            <button aria-label="Bulan sebelumnya" onClick={() => onShiftMonth(-1)}>
              ‹
            </button>
            <button onClick={onToday} disabled={month === today.slice(0, 7) && selectedDate === today}>
              Hari ini
            </button>
            <button aria-label="Bulan berikutnya" onClick={() => onShiftMonth(1)}>
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
            {weeks.map((week, w) => (
              <div className="week" key={w}>
                {week.map((c) => {
                  const dayEvents = c.outside ? [] : events.filter((e) => e.date === c.date)
                  const selected = !c.outside && c.date === selectedDate
                  return (
                    <div
                      key={c.date}
                      className={`day ${c.outside ? 'is-outside' : ''} ${selected ? 'is-selected' : ''}`}
                      onClick={() => !c.outside && onSelectDate(c.date)}
                      role={c.outside ? undefined : 'button'}
                      tabIndex={c.outside ? undefined : 0}
                      onKeyDown={(ev) => ev.key === 'Enter' && !c.outside && onSelectDate(c.date)}
                      aria-label={c.outside ? undefined : longDate(c.date)}
                      aria-current={c.date === today ? 'date' : undefined}
                    >
                      <span className="day__num" style={c.date === today ? { fontWeight: 700 } : undefined}>
                        {c.day}
                      </span>
                      {dayEvents.map((e) => (
                        <button
                          key={e.id}
                          className={`day__event ${e.status === 'Draf' ? 'is-draft' : ''}`}
                          onClick={(ev) => {
                            ev.stopPropagation()
                            onSelectDate(c.date)
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
          {published} terpublikasi · {drafts} draf · Tanggal terpilih: {longDate(selectedDate)}
        </p>
      </Card>

      <AgendaTerpilih event={selectedEvent} date={selectedDate} />
    </div>
  )
}

/** Rincian acara pada tanggal yang dipilih di kalender. */
function AgendaTerpilih({ event, date }: { event?: Event; date: string }) {
  const { openAddOn, openEdit, toggleStatus, confirmDelete } = useAksiAcara()

  return (
    <Card title="Agenda terpilih" subtitle={longDate(date)}>
      {event ? (
        <>
          {event.photo && <Photo {...PHOTOS[event.photo]} width="100%" height={148} />}
          <div>
            <Badge>{event.status}</Badge>
          </div>
          <p style={{ fontSize: 17, lineHeight: 1.5 }}>{event.name}</p>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
            {event.organizer}
          </p>
          <div>
            <DetailRow label="Waktu">{timeRange(event)}</DetailRow>
            <DetailRow label="Lokasi">{event.venue}</DetailRow>
            <DetailRow label="Penjualan">
              {event.quota !== undefined ? `${event.sold ?? 0} / ${event.quota} tiket` : 'Tanpa tiket berbayar'}
            </DetailRow>
          </div>
          <div className="btn-row">
            <button className="btn btn--primary" onClick={() => openEdit(event)}>
              Edit acara
            </button>
            <button className="btn" onClick={() => toggleStatus(event)}>
              {event.status === 'Draf' ? 'Terbitkan' : 'Tarik publikasi'}
            </button>
            <button className="btn btn--danger" onClick={() => confirmDelete(event)}>
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
            <button className="btn btn--primary" onClick={() => openAddOn(date)}>
              <Plus strokeWidth={2} /> Tambah acara
            </button>
          </div>
        </>
      )}
    </Card>
  )
}
