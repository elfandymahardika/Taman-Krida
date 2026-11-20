'use client'

import { Badge, Card, Cell, DataTable, Note, TableFoot } from '@/components/ui'
import { rupiah } from '@/data/format'
import type { Paginated } from '@/lib/api'

/** Jumlah pesanan per halaman yang diminta ke backend (`?limit=`). */
export const PAGE_SIZE = 10

type Props = {
  /** Pesanan tiket halaman aktif (sudah dipotong & difilter oleh backend). */
  rows: any[]
  pagination?: Paginated<unknown>['pagination']
  /** Data belum ada, atau baris yang tampil masih milik halaman/filter sebelumnya. */
  loading: boolean
  page: number
  onPage: (page: number) => void
  selectedId?: string
  onSelect: (order: any) => void
}

/** Tabel pesanan tiket dengan paginasi server; status pembayaran dan tiket ditampilkan terpisah. */
export default function DaftarPesanan({ rows, pagination, loading, page, onPage, selectedId, onSelect }: Props) {
  const from = pagination?.total ? (pagination.page - 1) * pagination.limit + 1 : 0

  return (
    <Card title="Daftar pesanan tiket" subtitle="Status pembayaran dan tiket ditampilkan terpisah.">
      <div aria-busy={loading}>
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
          footer={
            <TableFoot page={page} pages={pagination?.totalPages ?? 1} onPage={onPage}>
              {!pagination
                ? 'Memuat pesanan…'
                : pagination.total
                  ? `${from}–${from + rows.length - 1} dari ${pagination.total} pesanan tiket`
                  : 'Tidak ada pesanan yang cocok'}
            </TableFoot>
          }
        />
      </div>
      <Note>
        Tiket diterbitkan setelah pembayaran lunas. Pesanan yang belum diverifikasi tidak menambah angka tiket
        terjual.
      </Note>
    </Card>
  )
}
