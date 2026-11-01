'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { Badge, Card, Photo } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { PHOTOS } from '@/data/sample'
import { addDays, dowOf, longDate } from '@/data/format'
import { sortByDate, timeRange } from '@/data/events'
import type { Event } from '@/data/events'
import { eventDetail } from '@/data/eventforms'

/** Agenda terdekat: pilih tanggal di strip 7 hari. */
export default function AgendaTerdekat({ events, today }: { events: Event[]; today: string }) {
  const router = useRouter()
  const overlay = useOverlay()
  const [day, setDay] = useState<string | null>(null) // null = acara terpublikasi berikutnya
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const upcoming = sortByDate(events).filter((e) => e.date >= today)
  const list = day ? upcoming.filter((e) => e.date === day) : upcoming.filter((e) => e.status === 'Terpublikasi').slice(0, 4)
  const countOn = (d: string) => upcoming.filter((e) => e.date === d).length

  return (
    <Card
      title="Agenda terdekat"
      subtitle={day ? `${longDate(day)} · ${list.length} acara` : `Mulai ${longDate(today)} · ${list.length} acara terpublikasi berikutnya`}
      action={
        <Link className="link" href="/acara">
          Kelola kalender →
        </Link>
      }
      style={{ paddingBottom: 12 }}
    >
      <div className="day-strip" role="tablist" aria-label="Pilih tanggal agenda">
        <button role="tab" aria-selected={!day} className={`day-chip day-chip--all ${!day ? 'is-active' : ''}`} onClick={() => setDay(null)}>
          Semua
        </button>
        {days.map((d) => {
          const n = countOn(d)
          return (
            <button
              key={d}
              role="tab"
              aria-selected={day === d}
              aria-label={`${longDate(d)}, ${n} acara`}
              className={`day-chip ${day === d ? 'is-active' : ''} ${d === today ? 'is-today' : ''}`}
              onClick={() => setDay(d)}
            >
              <span className="day-chip__dow">{dowOf(d)}</span>
              <span className="day-chip__num">{Number(d.slice(8))}</span>
              <span className="day-chip__dots" aria-hidden="true">
                {Array.from({ length: Math.min(n, 3) }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
      <div>
        {list.map((e) => (
          <button key={e.id} className="agenda-item" onClick={() => overlay.showDetail(eventDetail(e, router.push))}>
            <div className="agenda-item__date">
              <span className="agenda-item__day">{dowOf(e.date)}</span>
              <span className={`agenda-item__num ${e.date === today ? 'is-today' : ''}`}>{e.date.slice(8)}</span>
            </div>
            {e.photo ? (
              <Photo {...PHOTOS[e.photo]} width={66} height={58} radius={6} />
            ) : (
              <span className="task__icon" style={{ width: 66, height: 58, borderRadius: 6 }}>
                <CalendarDays strokeWidth={1.75} />
              </span>
            )}
            <div className="agenda-item__info">
              <p className="agenda-item__title">{e.name}</p>
              <p className="muted" style={{ fontSize: 11 }}>
                {e.organizer}
              </p>
              <p className="muted" style={{ fontSize: 10 }}>
                {e.venue} · {timeRange(e)}
              </p>
            </div>
            <div className="agenda-item__status">
              {e.date === today ? <Badge tone="primary">Hari ini</Badge> : <Badge>{e.status}</Badge>}
              <span className="muted" style={{ fontSize: 10 }}>
                {e.quota !== undefined ? `${e.sold ?? 0} / ${e.quota} tiket` : 'Tanpa tiket'}
              </span>
            </div>
            <ChevronRight strokeWidth={1.75} />
          </button>
        ))}
        {!list.length && <p className="empty-note">{events.length ? 'Tidak ada acara pada tanggal ini.' : 'Memuat agenda…'}</p>}
      </div>
    </Card>
  )
}
