'use client'

import { Badge, Card, Cell, DataTable, TableFoot } from '@/components/ui'
import { shortDate } from '@/data/format'
import { range } from './jadwalfasilitas'

type Props = {
  /** Permintaan sewa hasil filter. */
  rows: any[]
  total: number
  loaded: boolean
  selectedId?: string
  onSelect: (id: string) => void
}

/** Tabel permintaan sewa; klik baris untuk meninjau. */
export default function DaftarSewa({ rows, total, loaded, selectedId, onSelect }: Props) {
  return (
    <Card title="Daftar permintaan sewa" subtitle="Persetujuan sewa terpisah dari status pembayaran.">
      <DataTable
        columns={[
          { label: 'Permintaan / pemesan', width: 215, render: (r) => <Cell main={r.id} sub={r.applicant} /> },
          { label: 'Fasilitas & jadwal', width: 260, render: (r) => <Cell main={r.venue} sub={`${shortDate(r.date)} · ${range(r.start, r.end)}${r.payment ? ` · ${r.payment}` : ''}`} /> },
          { label: 'Persetujuan', width: 155, render: (r) => <Badge>{r.approval}</Badge> },
          {
            label: 'Aksi',
            width: 85,
            render: (r) => <p className="cell__action">{r.approval === 'Perlu ditinjau' ? 'Tinjau →' : 'Detail →'}</p>,
          },
        ]}
        rows={rows}
        getKey={(r) => r.id}
        selected={selectedId}
        onRowClick={(r) => onSelect(r.id)}
        footer={<TableFoot>{loaded ? `Menampilkan ${rows.length} dari ${total} pemesanan` : 'Memuat permintaan…'}</TableFoot>}
      />
    </Card>
  )
}
