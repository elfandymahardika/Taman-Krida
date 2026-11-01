'use client'

import { Badge, Card, Cell, DataTable, TableFoot } from '@/components/ui'
import { relativeTime, wibDateTime } from '@/data/format'

const lastSeen = (s) => {
  if (!s.lastSeenAt || s.status === 'Undangan' || s.status === 'Menunggu persetujuan') return 'Belum masuk'
  return Date.now() - Date.parse(s.lastSeenAt) < 5 * 60_000 ? 'Aktif sekarang' : relativeTime(s.lastSeenAt)
}

type Props = {
  /** Staf hasil filter & urutan. */
  rows: any[]
  total: number
  loaded: boolean
  meId?: number
  selectedId?: number
  onSelect: (id: number) => void
}

/** Tabel staf admin; klik baris untuk mengelola akses. */
export default function DaftarPengguna({ rows, total, loaded, meId, selectedId, onSelect }: Props) {
  return (
    <Card title="Daftar pengguna" subtitle="Staf yang memiliki akses ke panel administrator.">
      <DataTable
        columns={[
          { label: 'Nama / email', width: 215, render: (s) => <Cell main={s.id === meId ? `${s.name} (Anda)` : s.name} sub={s.email} /> },
          { label: 'Peran', width: 125, render: (s) => <p className={s.roleKey ? '' : 'muted'}>{s.role}</p> },
          { label: 'Terakhir aktif', width: 100, render: (s) => <p title={s.lastSeenAt && wibDateTime(s.lastSeenAt)}>{lastSeen(s)}</p> },
          {
            label: 'Status',
            width: 90,
            render: (s) => (s.status === 'Menunggu persetujuan' ? <Badge tone="warning">Menunggu</Badge> : <Badge>{s.status}</Badge>),
          },
          { label: 'Aksi', width: 56, render: (s) => <p className="cell__action">{s.status === 'Menunggu persetujuan' ? 'Tinjau →' : 'Kelola →'}</p> },
        ]}
        rows={rows}
        getKey={(s) => s.id}
        selected={selectedId}
        onRowClick={(s) => onSelect(s.id)}
        footer={<TableFoot>{loaded ? `Menampilkan ${rows.length} dari ${total} staf` : 'Memuat staf…'}</TableFoot>}
      />
    </Card>
  )
}
