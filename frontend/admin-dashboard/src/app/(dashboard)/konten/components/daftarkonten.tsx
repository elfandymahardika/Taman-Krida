'use client'

import { Badge, Card, Cell, DataTable, TableFoot } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { wibDateTime } from '@/data/format'
import { mutate } from '@/lib/api'
import { STATUSES, TYPES } from './jeniskonten'

const PAGE_SIZE = 8

type Props = {
  /** Konten hasil filter. */
  contents: any[]
  loaded: boolean
  page: number
  onPage: (page: number) => void
}

/** Tabel konten dengan paginasi; klik baris untuk mengedit. */
export default function DaftarKonten({ contents, loaded, page, onPage }: Props) {
  const overlay = useOverlay()
  const pages = Math.max(1, Math.ceil(contents.length / PAGE_SIZE))
  const safePage = Math.min(page, pages - 1)
  const pageRows = contents.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const editRow = (c) =>
    overlay.showForm({
      title: c.isHero ? 'Edit banner beranda' : 'Edit konten',
      subtitle: `${c.type} · diperbarui ${wibDateTime(c.updatedAt)} oleh ${c.author}`,
      success: 'Perubahan konten tersimpan',
      onSubmit: (d) => mutate(`/contents/${c.id}`, { method: 'PUT', body: d }),
      fields: [
        { name: 'title', label: 'Judul konten', defaultValue: c.title, required: true, maxLength: 120 },
        {
          row: [
            { name: 'type', label: 'Jenis konten', as: 'select', options: TYPES, defaultValue: c.type },
            { name: 'status', label: 'Status', as: 'select', options: STATUSES, defaultValue: c.status },
          ],
        },
        { name: 'summary', label: 'Isi ringkas', as: 'textarea', defaultValue: c.summary, placeholder: 'Opsional · maksimal 300 karakter' },
      ],
    })

  return (
    <Card title="Daftar konten" subtitle="Konten terbaru di seluruh kanal aplikasi publik. Klik baris untuk mengedit.">
      <DataTable
        columns={[
          { label: 'Judul / jenis', width: 370, render: (c) => <Cell main={c.title} sub={c.isHero ? `${c.type} · tampil di beranda` : c.type} /> },
          { label: 'Penulis', width: 180, render: (c) => <p>{c.author}</p> },
          { label: 'Diperbarui', width: 200, render: (c) => <p>{wibDateTime(c.updatedAt)}</p> },
          { label: 'Status', width: 135, render: (c) => <Badge>{c.status}</Badge> },
          { label: 'Aksi', width: 130, render: (c) => <p className="cell__action">{c.status === 'Draf' ? 'Edit · Terbitkan →' : 'Edit →'}</p> },
        ]}
        rows={pageRows}
        getKey={(c) => c.id}
        onRowClick={editRow}
        footer={
          <TableFoot page={safePage} pages={pages} onPage={onPage}>
            {loaded ? `Menampilkan ${pageRows.length} dari ${contents.length} konten` : 'Memuat konten…'}
          </TableFoot>
        }
      />
    </Card>
  )
}
