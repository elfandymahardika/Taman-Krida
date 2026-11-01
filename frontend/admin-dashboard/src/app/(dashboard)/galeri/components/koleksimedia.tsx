'use client'

import { useState } from 'react'
import { Badge, Card, Photo } from '@/components/ui'
import { PHOTOS } from '@/data/sample'
import { shortDate } from '@/data/format'
import { assetUrl } from '@/lib/api'

const PREVIEW = 6

/** Props <Photo> untuk satu media: berkas unggahan atau foto contoh. */
export const photoOf = (m) => (m.url ? { url: assetUrl(m.url), video: m.type === 'Video', alt: m.title } : { ...PHOTOS[m.photo ?? 'wayang'], alt: m.title })

type Props = {
  /** Media hasil filter. */
  media: any[]
  loaded: boolean
  selectedId?: string
  onSelect: (id: string) => void
}

/** Grid media; klik kartu untuk membuka metadatanya. */
export default function KoleksiMedia({ media, loaded, selectedId, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false)
  const rows = expanded ? media : media.slice(0, PREVIEW)

  return (
    <Card
      title="Koleksi media"
      subtitle={`${media.length} media · Pilih media untuk mengubah metadata.`}
      action={
        media.length > PREVIEW && (
          <button className="link" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Ringkas ↑' : `Lihat semua (${media.length}) →`}
          </button>
        )
      }
    >
      <div className="media-grid">
        {rows.map((m) => (
          <button key={m.id} className={`media-card ${m.id === selectedId ? 'is-selected' : ''}`} onClick={() => onSelect(m.id)}>
            <Photo {...photoOf(m)} width="100%" height={140} radius={6} />
            <div className="media-card__meta">
              <strong>{m.title}</strong>
              <span>
                {m.type} · {m.collection} · {shortDate(m.date)}
              </span>
            </div>
            <div>
              <Badge>{m.status}</Badge>
            </div>
          </button>
        ))}
      </div>
      {loaded && !media.length && <p className="muted">Tidak ada media untuk filter ini.</p>}
    </Card>
  )
}
