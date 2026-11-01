'use client'

import { Badge, Card, Cell, DataTable, Note, TableFoot } from '@/components/ui'
import { rupiah } from '@/data/format'

type Props = {
  /** Pesanan tiket hasil filter. */
  rows: any[]
  total: number
  loaded: boolean
  selectedId?: string
  onSelect: (order: any) => void
}

/** Tabel pesanan tiket; status pembayaran dan tiket ditampilkan terpisah. */
export default function DaftarPesanan({ rows, total, loaded, selectedId, onSelect }: Props) {
  return (
    <Card title="Daftar pesanan tiket" subtitle="Status pembayaran dan tiket ditampilkan terpisah.">
      <DataTable
        columns={[
          { label: 'Pesanan / pemesan', width: 176, render: (o) => <Cell main={o.id} sub={o.customer} /> },
          { label: 'Acara / jumlah', width: 180, render: (o) => <Cell main={o.serviceShort} sub={`${o.qty} tiket · ${rupiah(o.amount)}`} /> },
          { label: 'Pembayaran', width: 132, render: (o) => <Badge>{o.payment}</Badge> },
          { label: 'Status tiket', width: 125, render: (o) => <Badge>{o.ticket.status}</Badge> },
          {
            label: 'Aksi',
            width: 80,
            render: (o) => <p className="cell__action">{o.payment === 'Perlu verifikasi' ? 'Tinjau →' : 'Detail →'}</p>,
          },
        ]}
        rows={rows}
        getKey={(o) => o.id}
        selected={selectedId}
        onRowClick={onSelect}
        footer={<TableFoot>{loaded ? `${rows.length} dari ${total} pesanan tiket` : 'Memuat pesanan…'}</TableFoot>}
      />
      <Note>
        Tiket diterbitkan setelah pembayaran lunas. Pesanan yang belum diverifikasi tidak menambah angka tiket
        terjual.
      </Note>
    </Card>
  )
}
