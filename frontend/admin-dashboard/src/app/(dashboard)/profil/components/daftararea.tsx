'use client'

import { Lock, ParkingSquare } from 'lucide-react'
import { Card, Photo } from '@/components/ui'
import { PHOTOS } from '@/data/sample'
import { describe, useFormArea } from './formarea'

type Props = {
  areas: any[]
  activeArea: string
  onActivate: (id: string) => void
}

/** Daftar area & fasilitas; arahkan kursor untuk menyorot area di denah. */
export default function DaftarArea({ areas, activeArea, onActivate }: Props) {
  const editArea = useFormArea()

  return (
    <Card
      title="Daftar area & fasilitas"
      subtitle={`${areas.length} area · Area yang dapat dipilih pengunjung dan pemohon sewa.`}
      action={
        <button className="link" onClick={() => editArea()}>
          Tambah area →
        </button>
      }
    >
      {areas.map((a) => (
        <div
          key={a.id}
          className="area-item"
          onMouseEnter={() => onActivate(a.id)}
          style={{ background: activeArea === a.id ? 'var(--c-bg)' : undefined, borderRadius: 8, padding: 5 }}
        >
          {a.photo ? (
            <Photo {...PHOTOS[a.photo]} width={60} height={46} radius={6} />
          ) : (
            <div className="task__icon" style={{ width: 60, height: 46, borderRadius: 6 }}>
              <ParkingSquare strokeWidth={1.75} />
            </div>
          )}
          <div className="area-item__info">
            <strong>
              {a.name} {a.bookable && <Lock className="inline-icon" strokeWidth={1.75} aria-label="Dipakai acara & sewa" />}
            </strong>
            <span>{describe(a)}</span>
            {a.note && <span>{a.note}</span>}
          </div>
          <button className="link link--sm" onClick={() => editArea(a)}>
            Edit →
          </button>
        </div>
      ))}
    </Card>
  )
}
