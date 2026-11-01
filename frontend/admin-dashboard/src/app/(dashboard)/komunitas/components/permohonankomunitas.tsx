'use client'

import { Badge, Card, Cell, DataTable, TableFoot } from '@/components/ui'
import { wibDateTime } from '@/data/format'

/** Status permohonan: komunitas yang sudah disetujui tampil sebagai "Disetujui". */
export const applicationStatus = (c) => (c.status === 'Aktif' || c.status === 'Nonaktif' ? 'Disetujui' : c.status)

type Props = {
  applications: any[]
  pending: number
  selectedId?: string
  onSelect: (id: string) => void
}

/** Tabel permohonan pendaftaran komunitas; klik baris untuk meninjau. */
export default function PermohonanKomunitas({ applications, pending, selectedId, onSelect }: Props) {
  return (
    <Card title="Permohonan pendaftaran" subtitle="Komunitas baru yang mengajukan diri ke direktori.">
      <DataTable
        columns={[
          { label: 'Komunitas / kategori', width: 290, render: (a) => <Cell main={a.name} sub={a.category} /> },
          { label: 'Status', width: 190, render: (a) => <Badge>{applicationStatus(a)}</Badge> },
          { label: 'Diajukan', width: 140, render: (a) => <p>{wibDateTime(a.appliedAt)}</p> },
          { label: 'Aksi', width: 80, render: () => <p className="cell__action">Tinjau →</p> },
        ]}
        rows={applications}
        getKey={(a) => a.id}
        selected={selectedId}
        onRowClick={(a) => onSelect(a.id)}
        footer={<TableFoot>{pending ? `${pending} permohonan menunggu` : 'Semua permohonan sudah diputuskan'}</TableFoot>}
      />
    </Card>
  )
}
