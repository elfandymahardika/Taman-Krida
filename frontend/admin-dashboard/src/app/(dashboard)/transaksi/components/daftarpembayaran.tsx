'use client'

import { Badge, Card, Cell, DataTable, TableFoot } from '@/components/ui'
import { orderDetail, rupiah } from '@/data/format'
import type { Paginated } from '@/lib/api'

/** Jumlah baris per halaman yang diminta ke backend (`?limit=`). */
export const PAGE_SIZE = 10

type Props = {
  /** Baris halaman aktif (sudah dipotong & difilter oleh backend). */
  rows: any[]
  pagination?: Paginated<unknown>['pagination']
  /** Data belum ada, atau baris yang tampil masih milik halaman/filter sebelumnya. */
  loading: boolean
  page: number
  onPage: (page: number) => void
  selectedId?: string
  onRowClick: (order: any) => void
}

/** Tabel semua pembayaran tiket & sewa dengan paginasi server. */
export default function DaftarPembayaran({ rows, pagination, loading, page, onPage, selectedId, onRowClick }: Props) {
  const from = pagination && pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0
  const to = pagination ? from + rows.length - (from ? 1 : 0) : 0

  return (
    <Card title="Daftar pembayaran" subtitle="Transaksi terbaru dari tiket pertunjukan dan sewa gedung.">
      <div aria-busy={loading}>
        <DataTable
          columns={[
            { label: 'Transaksi / pemesan', width: 176, render: (o) => <Cell main={o.id} sub={o.customer} /> },
            { label: 'Layanan', width: 225, render: (o) => <Cell main={o.serviceShort} sub={orderDetail(o)} /> },
            { label: 'Nominal', width: 102, render: (o) => <p>{rupiah(o.amount)}</p> },
            { label: 'Pembayaran', width: 145, render: (o) => <Badge>{o.payment}</Badge> },
            {
              label: 'Aksi',
              width: 80,
              render: (o) => <p className="cell__action">{o.payment === 'Perlu verifikasi' ? 'Verifikasi →' : 'Detail →'}</p>,
            },
          ]}
          rows={rows}
          getKey={(o) => o.id}
          selected={selectedId}
          onRowClick={onRowClick}
          footer={
            <TableFoot page={page} pages={pagination?.totalPages ?? 1} onPage={onPage}>
              {!pagination
                ? 'Memuat transaksi…'
                : pagination.total
                  ? `Menampilkan ${from}–${to} dari ${pagination.total} transaksi`
                  : 'Tidak ada transaksi yang cocok'}
            </TableFoot>
          }
        />
      </div>
    </Card>
  )
}
