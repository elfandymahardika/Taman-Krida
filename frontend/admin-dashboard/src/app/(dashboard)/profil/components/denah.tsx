'use client'

import { Card } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { useFormArea } from './formarea'

/** Posisi area pada skema denah (area baru hanya tampil di daftar). */
const FLOORPLAN = [
  { id: 'galeri', style: { gridColumn: 1, gridRow: 1 } },
  { id: 'loket', style: { gridColumn: 3, gridRow: 1 } },
  { id: 'pendopo', style: { gridColumn: 1, gridRow: 3 } },
  { id: 'panggung', style: { gridColumn: 3, gridRow: 3 } },
]

type Props = {
  areas: any[]
  activeArea: string
  onActivate: (id: string) => void
}

/** Skema denah TKBJ; klik area untuk menyorot dan membuka detailnya. */
export default function Denah({ areas, activeArea, onActivate }: Props) {
  const overlay = useOverlay()
  const editArea = useFormArea()
  const active = areas.find((a) => a.id === activeArea)

  return (
    <Card
      title="Pratinjau denah"
      subtitle="Skema area contoh · Bukan peta geografis"
      action={
        active && (
          <button
            className="link"
            onClick={() =>
              overlay.showDetail({
                subtitle: active.name,
                rows: [
                  ['Kapasitas', active.capacity !== undefined ? `${active.capacity} orang` : '—'],
                  ['Fungsi', active.purpose],
                  ['Dipakai acara & sewa', active.bookable ? 'Ya' : 'Tidak'],
                  ...(active.note ? [['Catatan', active.note]] : []),
                ],
                cancelLabel: 'Tutup',
                primaryLabel: 'Edit area',
                success: 'Membuka formulir',
                onPrimary: () => setTimeout(() => editArea(active)),
              })
            }
          >
            Detail area →
          </button>
        )
      }
    >
      <div className="floorplan" aria-label="Skema denah TKBJ">
        {FLOORPLAN.map(({ id, style }) => {
          const area = areas.find((a) => a.id === id)
          return (
            area && (
              <button key={id} className={`floorplan__area ${activeArea === id ? 'is-active' : ''}`} style={style} onClick={() => onActivate(id)}>
                {area.name}
              </button>
            )
          )
        })}
        <div className="floorplan__path" style={{ gridColumn: '1 / 4', gridRow: 2 }} />
        <div className="floorplan__path floorplan__path--v" style={{ gridColumn: 2, gridRow: '1 / 4' }} />
      </div>
      <p className="muted" style={{ fontSize: 10, lineHeight: 1.5 }}>
        Garis kuning = jalur pengunjung · Pilih area untuk menyorot fasilitas.
        {active && ` Terpilih: ${active.name}${active.capacity !== undefined ? ` (${active.capacity} orang)` : ''}.`}
      </p>
    </Card>
  )
}
