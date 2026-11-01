'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Badge, Card, Cell, DataTable, TableFoot } from '@/components/ui'
import { formatDate, timeRange } from '@/data/events'
import type { Event } from '@/data/events'
import { useAksiAcara } from './aksiacara'

const PAGE_SIZE = 6

type Props = {
  /** Acara hasil filter. */
  events: Event[]
  page: number
  onPage: (page: number) => void
  published: number
  drafts: number
}

/** Tabel acara dengan aksi edit, terbitkan/tarik, hapus, dan paginasi. */
export default function DaftarAcara({ events, page, onPage, published, drafts }: Props) {
  const { openEdit, toggleStatus, confirmDelete, resetSample } = useAksiAcara()
  const pages = Math.max(1, Math.ceil(events.length / PAGE_SIZE))
  const safePage = Math.min(page, pages - 1)
  const pageRows = events.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  return (
    <Card
      title="Daftar acara"
      subtitle="Kelola detail dan status publikasi agenda. Perubahan tersimpan di database backend."
      action={
        <p className="link" style={{ textDecoration: 'none' }}>
          {published} terpublikasi · {drafts} draf
        </p>
      }
    >
      <DataTable
        columns={[
          { label: 'Acara / penyelenggara', width: 300, render: (e) => <Cell main={e.name} sub={e.organizer} /> },
          { label: 'Tanggal & waktu', width: 160, render: (e) => <Cell main={formatDate(e)} sub={timeRange(e)} /> },
          { label: 'Lokasi', width: 190, render: (e) => <p>{e.venue}</p> },
          { label: 'Publikasi', width: 110, render: (e) => <Badge>{e.status}</Badge> },
          {
            label: 'Aksi',
            width: 260,
            render: (e) => (
              <div className="row-actions">
                <button className="pill" onClick={() => openEdit(e)}>
                  <Pencil strokeWidth={1.75} /> Edit
                </button>
                <button className="pill" onClick={() => toggleStatus(e)}>
                  {e.status === 'Draf' ? 'Terbitkan' : 'Tarik'}
                </button>
                <button className="pill pill--danger" onClick={() => confirmDelete(e)}>
                  <Trash2 strokeWidth={1.75} /> Hapus
                </button>
              </div>
            ),
          },
        ]}
        rows={pageRows}
        getKey={(e) => e.id}
        footer={
          <>
            {!events.length && (
              <p className="muted" style={{ padding: '24px 12px', textAlign: 'center' }}>
                Tidak ada acara yang cocok dengan pencarian atau filter.
              </p>
            )}
            <TableFoot page={safePage} pages={pages} onPage={onPage}>
              Menampilkan {pageRows.length} dari {events.length} acara ·{' '}
              <button className="link link--sm" onClick={resetSample}>
                Pulihkan data contoh
              </button>
            </TableFoot>
          </>
        }
      />
    </Card>
  )
}
