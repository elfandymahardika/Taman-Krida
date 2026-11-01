'use client'

import { Badge, Card, Cell, DataTable, TableFoot } from '@/components/ui'
import { orderDetail, rupiah } from '@/data/format'

const PAGE_SIZE = 8

type Props = {
  /** Transaksi hasil filter. */
  rows: any[]
  loaded: boolean
  page: number
  onPage: (page: number) => void
  selectedId?: string
  onRowClick: (order: any) => void
}

/** Tabel semua pembayaran tiket & sewa dengan paginasi. */
export default function DaftarPembayaran({ rows, loaded, page, onPage, selectedId, onRowClick }: Props) {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pages - 1)
  const pageRows = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  return (
    <Card title="Daftar pembayaran" subtitle="Transaksi terbaru dari tiket pertunjukan dan sewa gedung.">
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
        rows={pageRows}
        getKey={(o) => o.id}
        selected={selectedId}
        onRowClick={onRowClick}
        footer={
          <TableFoot page={safePage} pages={pages} onPage={onPage}>
            {loaded ? `Menampilkan ${pageRows.length} dari ${rows.length} transaksi` : 'Memuat transaksi…'}
          </TableFoot>
        }
      />
    </Card>
  )
}
