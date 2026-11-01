'use client'

import { useState } from 'react'
import { Card } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { VENUES, formatTime } from '@/data/events'
import type { Event } from '@/data/events'
import { addDays, shortDate } from '@/data/format'

const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

/** "09:00", "15:00" → "09.00–15.00" */
export const range = (start: string, end: string) => `${formatTime(start)}–${formatTime(end)}`
const dayLabel = (iso: string) => `${DAY_SHORT[new Date(`${iso}T00:00:00Z`).getUTCDay()]} ${iso.slice(8)}`

type Slot = { kind: 'event' | 'review' | 'free'; label: string; time: string; title?: string; id?: string }

/** Status satu fasilitas pada satu tanggal, dari acara + permintaan sewa. */
function slotFor(venue: string, date: string, events: Event[], rentals: any[]): Slot {
  const event = events.find((e) => e.venue === venue && e.date === date)
  if (event) return { kind: 'event', label: 'Acara', time: range(event.start, event.end), title: event.name }
  const booked = rentals.find((r) => r.venue === venue && r.date === date && r.approval === 'Disetujui')
  if (booked) return { kind: 'event', label: 'Disewa', time: range(booked.start, booked.end), title: booked.applicant, id: booked.id }
  const review = rentals.find((r) => r.venue === venue && r.date === date && r.approval === 'Perlu ditinjau')
  if (review) return { kind: 'review', label: 'Ditinjau', time: range(review.start, review.end), title: review.applicant, id: review.id }
  return { kind: 'free', label: 'Tersedia', time: '08.00–22.00' }
}

type Props = {
  events: Event[]
  rentals: any[]
  today: string
  /** Klik slot "Tersedia" → formulir pemesanan terisi fasilitas & tanggal. */
  onBook: (prefill: { venue: string; date: string }) => void
  /** Klik slot sewa → tinjau permintaannya. */
  onSelect: (rentalId: string) => void
}

/** Jadwal 7 hari per fasilitas: acara, sewa disetujui, sewa ditinjau, atau tersedia. */
export default function JadwalFasilitas({ events, rentals, today, onBook, onSelect }: Props) {
  const overlay = useOverlay()
  const [week, setWeek] = useState(0)
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, week * 7 + i))

  const openSlot = (facility: string, date: string, slot: Slot) => {
    if (slot.kind === 'free') return onBook({ venue: facility, date })
    if (slot.id) return onSelect(slot.id)
    overlay.showDetail({
      title: slot.title,
      subtitle: `${facility} · ${shortDate(date)}`,
      rows: [
        ['Jenis', 'Agenda acara TKBJ'],
        ['Waktu', `${slot.time} WIB`],
        ['Catatan', 'Acara memblokir jadwal sewa di fasilitas ini.'],
      ],
      cancelLabel: 'Tutup',
    })
  }

  return (
    <Card
      title="Jadwal & ketersediaan fasilitas"
      subtitle={`${shortDate(days[0], false)} – ${shortDate(days[6])} · klik slot "Tersedia" untuk memesan`}
      action={
        <div className="pager" style={{ fontWeight: 600, fontSize: 12 }}>
          <button aria-label="Pekan sebelumnya" onClick={() => setWeek((w) => w - 1)}>
            ‹
          </button>
          <button onClick={() => setWeek(0)} disabled={week === 0}>
            Pekan ini
          </button>
          <button aria-label="Pekan berikutnya" onClick={() => setWeek((w) => w + 1)}>
            ›
          </button>
        </div>
      }
    >
      <div className="table-wrap">
        <div className="schedule">
          <span className="schedule__head">Fasilitas</span>
          {days.map((d) => (
            <span key={d} className={`schedule__head schedule__head--center ${d === today ? 'is-today' : ''}`}>
              {dayLabel(d)}
            </span>
          ))}
          {VENUES.map((facility) => (
            <div key={facility} style={{ display: 'contents' }}>
              <span className="schedule__facility">{facility}</span>
              {days.map((d) => {
                const s = slotFor(facility, d, events, rentals)
                return (
                  <button key={d} className={`slot slot--${s.kind} slot--btn`} title={s.title ?? 'Klik untuk memesan'} onClick={() => openSlot(facility, d, s)}>
                    {s.label}
                    <small>{s.time}</small>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="muted" style={{ fontSize: 10, lineHeight: 1.5 }}>
        Acara/Disewa = jadwal terblokir · Ditinjau = permintaan belum diputuskan · Tersedia = bisa dipesan
      </p>
    </Card>
  )
}
