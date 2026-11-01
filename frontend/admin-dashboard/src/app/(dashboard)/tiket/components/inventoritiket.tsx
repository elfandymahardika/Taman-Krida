'use client'

import { Ticket } from 'lucide-react'
import { Badge, Card, Photo, Progress } from '@/components/ui'
import { PHOTOS } from '@/data/sample'
import { rupiah } from '@/data/format'
import { formatDate, timeRange } from '@/data/events'
import type { Event } from '@/data/events'

/** Kartu kuota & penjualan tiket per acara. */
export default function InventoriTiket({ ticketed, onEdit }: { ticketed: Event[]; onEdit: (e: Event) => void }) {
  return (
    <Card title="Inventori per acara" subtitle="Kuota & harga bisa diatur per acara · angka terjual bertambah saat pembayaran diverifikasi">
      <div className="inventory">
        {ticketed.map((e) => {
          const soldE = e.sold ?? 0
          const pct = e.quota ? Math.round((soldE / e.quota) * 100) : 0
          return (
            <div className="inventory-card" key={e.id}>
              <div className="inventory-card__id">
                {e.photo ? (
                  <Photo {...PHOTOS[e.photo]} width={72} height={64} />
                ) : (
                  <span className="task__icon" style={{ width: 72, height: 64 }}>
                    <Ticket strokeWidth={1.75} />
                  </span>
                )}
                <div className="inventory-card__name">
                  <strong>{e.name}</strong>
                  <span>
                    {formatDate(e, false)} · {timeRange(e)}
                  </span>
                </div>
              </div>
              <div className="inventory-card__count">
                {soldE} / {e.quota}
                <Badge>{e.status}</Badge>
              </div>
              <Progress value={pct} />
              <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
                {e.quota - soldE} tiket tersisa · {pct}% terjual · {rupiah(e.price ?? 0)}/tiket
              </p>
              <button className="link" onClick={() => onEdit(e)}>
                Atur kuota &amp; harga →
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
