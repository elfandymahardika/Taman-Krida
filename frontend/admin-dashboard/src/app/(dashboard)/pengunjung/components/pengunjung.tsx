'use client'

import { useState } from 'react'
import { Badge, Card, Cell, DataTable, ErrorBanner, Filters, Metrics, PageFooter, PageHeader, TableFoot } from '@/components/ui'
import { useAccess } from '@/lib/access'
import { type Paginated, useDebouncedValue, useQuery, withQuery } from '@/lib/api'
import { wibDateTime } from '@/data/format'
import { STATUSES, activityOf, useAksiPengunjung } from './aksipengunjung'
import type { Visitor } from './aksipengunjung'

const PAGE_SIZE = 10
const ALL = 'Semua status'
const NONE: Visitor[] = []

/** Akun pengunjung aplikasi mobile: cari, lihat rincian, nonaktifkan / aktifkan kembali. */
export default function Pengunjung() {
  const { showDetail, deactivate, activate } = useAksiPengunjung()
  const canEdit = useAccess().canEdit('admin')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(ALL)
  const [page, setPage] = useState(0)
  const q = useDebouncedValue(query.trim())

  // Paginasi & pencarian dikerjakan backend; `keepPrevious` menahan baris lama saat pindah halaman.
  const listQ = useQuery<Paginated<Visitor>>(
    withQuery('/visitors', { page: page + 1, limit: PAGE_SIZE, q, status: status !== ALL && status }),
    { keepPrevious: true },
  )
  const stats = useQuery<{ total: number; active: number; disabled: number; recent: number }>('/visitors/stats').data
  const rows = listQ.data?.data ?? NONE
  const pagination = listQ.data?.pagination
  const from = pagination?.total ? (pagination.page - 1) * pagination.limit + 1 : 0

  const filter = (fn: (v: string) => void) => (v: string) => {
    fn(v)
    setPage(0)
  }

  return (
    <>
      <PageHeader
        title="Akun pengunjung"
        subtitle="Akun yang mendaftar lewat aplikasi mobile TKBJ. Akun yang dinonaktifkan langsung keluar dari aplikasi dan tidak bisa masuk lagi; pesanan & sewanya tetap tersimpan."
      />
      <ErrorBanner error={listQ.error} onRetry={listQ.reload} />
      <Metrics
        items={[
          { label: 'Total akun', value: stats?.total ?? '—', hint: 'terdaftar di aplikasi' },
          { label: 'Aktif', value: stats?.active ?? '—', hint: 'bisa masuk & bertransaksi' },
          { label: 'Nonaktif', value: stats?.disabled ?? '—', hint: 'diblokir oleh admin' },
          { label: 'Baru 30 hari', value: stats?.recent ?? '—', hint: 'pendaftar terbaru' },
        ]}
      />
      <Filters
        search={{ placeholder: 'Cari nama, email, atau telepon...', value: query, onChange: filter(setQuery) }}
        selects={[{ label: 'Status', value: status, onChange: filter(setStatus), options: [ALL, ...STATUSES] }]}
      />

      <Card title="Daftar akun" subtitle="Klik baris untuk melihat rincian & aktivitas akun.">
        <DataTable<Visitor>
          columns={[
            { label: 'Nama / email', width: 300, render: (v) => <Cell main={v.name} sub={v.email} /> },
            { label: 'Kontak', width: 170, render: (v) => <Cell main={v.phone} sub={v.city || '—'} /> },
            { label: 'Aktivitas', width: 240, render: (v) => <p>{activityOf(v)}</p> },
            {
              label: 'Terdaftar / login',
              width: 210,
              render: (v) => <Cell main={wibDateTime(v.createdAt)} sub={v.lastLogin ? `Login ${wibDateTime(v.lastLogin)}` : 'Belum pernah login'} />,
            },
            { label: 'Status', width: 110, render: (v) => <Badge tone={v.status === 'Aktif' ? 'success' : 'neutral'}>{v.status}</Badge> },
            {
              label: 'Aksi',
              width: 130,
              render: (v) =>
                canEdit ? (
                  // Tombol aksi tidak ikut membuka rincian baris.
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    {v.status === 'Aktif' ? (
                      <button className="pill pill--danger" onClick={() => deactivate(v)}>
                        Nonaktifkan
                      </button>
                    ) : (
                      <button className="pill" onClick={() => activate(v)}>
                        Aktifkan
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="cell__action">Rincian →</p>
                ),
            },
          ]}
          rows={rows}
          getKey={(v) => String(v.id)}
          onRowClick={showDetail}
          footer={
            <TableFoot page={page} pages={pagination?.totalPages ?? 1} onPage={setPage}>
              {!pagination
                ? 'Memuat akun…'
                : pagination.total
                  ? `Menampilkan ${from}–${from + rows.length - 1} dari ${pagination.total} akun`
                  : 'Tidak ada akun untuk filter ini.'}
            </TableFoot>
          }
        />
      </Card>
      <PageFooter />
    </>
  )
}
