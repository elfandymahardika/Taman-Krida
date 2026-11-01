'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, ListFilter } from 'lucide-react'
import { Badge, Cell, DataTable, ErrorBanner, SearchField, Tabs } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { orderDetail, rupiah, wibDateTime } from '@/data/format'
import { mutate, useQuery } from '@/lib/api'

const REFRESH_MS = 30000
const ORDER_PREVIEW = 5
const STATUS_FILTERS = ['Semua status', 'Lunas', 'Perlu verifikasi', 'Menunggu bayar']

/** Transaksi terbaru: filter, cari, verifikasi langsung. */
export default function TransaksiTerbaru() {
  const router = useRouter()
  const overlay = useOverlay()
  const [tab, setTab] = useState('Semua')
  const [status, setStatus] = useState('Semua status')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const { data, error, reload } = useQuery('/orders?limit=100', { refreshInterval: REFRESH_MS })

  const all = data ?? []
  const q = query.trim().toLowerCase()
  const filtered = all.filter(
    (o) =>
      (tab === 'Semua' || o.type === tab) &&
      (status === 'Semua status' || o.payment === status) &&
      `${o.id} ${o.customer} ${o.service}`.toLowerCase().includes(q),
  )
  const rows = expanded ? filtered : filtered.slice(0, ORDER_PREVIEW)
  const pending = all.filter((o) => o.payment === 'Perlu verifikasi').length

  const openOrder = (o) =>
    overlay.showDetail({
      title: 'Detail transaksi',
      subtitle: `${o.id} · ${o.type}`,
      rows: [
        ['Pemesan', o.customer],
        ['Layanan', o.service],
        ['Rincian', orderDetail(o)],
        ['Nominal', rupiah(o.amount)],
        ['Pembayaran', <Badge key="payment">{o.payment}</Badge>],
        ...(o.proof ? [['Bukti transfer', `${o.proof.method} · ${o.proof.from} · ${wibDateTime(o.proof.submittedAt)}`]] : []),
        ...(o.paidAt ? [['Lunas pada', `${wibDateTime(o.paidAt)}${o.method ? ` · ${o.method}` : ''}`]] : []),
        ...(o.ticket?.codes.length ? [['Kode tiket', o.ticket.codes.join(' · ')]] : []),
      ],
      cancelLabel: 'Tutup',
      ...(o.payment === 'Perlu verifikasi'
        ? {
            primaryLabel: 'Verifikasi lunas',
            success: `Pembayaran ${o.id} terverifikasi`,
            onPrimary: () => mutate(`/orders/${o.id}/verify`, { method: 'POST' }),
            secondary: {
              label: 'Minta ulang',
              success: 'Permintaan bukti ulang terkirim',
              onClick: () => mutate(`/orders/${o.id}/reject`, { method: 'POST' }),
            },
          }
        : o.payment === 'Menunggu bayar'
          ? { primaryLabel: 'Kelola di Transaksi', success: 'Membuka halaman transaksi', onPrimary: () => router.push('/transaksi') }
          : {}),
    })

  return (
    <section className="card card--flush">
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="section-head">
          <div className="section-head__text" style={{ lineHeight: 'normal', gap: 5 }}>
            <h2 className="section-head__title" style={{ margin: 0, fontWeight: 400 }}>
              Transaksi &amp; pemesanan
            </h2>
            <p className="section-head__sub">
              Pesanan terbaru dari tiket pertunjukan dan sewa gedung
              {pending ? ` · ${pending} menunggu verifikasi` : ''}
            </p>
          </div>
          <Link className="link" href="/transaksi">
            Lihat semua →
          </Link>
        </div>
        <div className="orders-toolbar">
          <Tabs items={['Semua', 'Tiket', 'Sewa gedung']} value={tab} onChange={setTab} />
          <SearchField placeholder="Cari ID atau pemesan..." value={query} onChange={setQuery} />
          <button
            className="status-filter"
            onClick={() =>
              overlay.showChoice({
                title: 'Pilih filter',
                subtitle: 'Tentukan nilai filter untuk menyaring data pada tabel.',
                options: STATUS_FILTERS,
                value: status,
                onChoose: setStatus,
              })
            }
          >
            <ListFilter strokeWidth={1.75} /> {status} <ChevronDown strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <ErrorBanner error={error} onRetry={reload} />
      <DataTable
        columns={[
          { label: 'Pesanan / pemesan', width: 176, render: (o) => <Cell size="lg" main={o.id} sub={o.customer} /> },
          { label: 'Layanan', width: 225, render: (o) => <Cell size="lg" main={o.serviceShort} sub={orderDetail(o)} /> },
          { label: 'Nominal', width: 102, render: (o) => <p style={{ fontSize: 12 }}>{rupiah(o.amount)}</p> },
          { label: 'Pembayaran', width: 145, render: (o) => <Badge>{o.payment}</Badge> },
          {
            label: 'Aksi',
            width: 80,
            render: (o) => <p className="cell__action">{o.payment === 'Perlu verifikasi' ? 'Verifikasi →' : 'Detail →'}</p>,
          },
        ]}
        rows={rows}
        getKey={(o) => o.id}
        onRowClick={openOrder}
      />
      <div className="table__foot">
        <p>
          {data
            ? filtered.length
              ? `Menampilkan ${rows.length} dari ${filtered.length} transaksi · terbaru lebih dahulu`
              : 'Tidak ada transaksi untuk filter ini'
            : 'Memuat transaksi…'}
        </p>
        {filtered.length > ORDER_PREVIEW && (
          <button className="link link--sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Ringkas ↑' : `Tampilkan semua (${filtered.length}) ↓`}
          </button>
        )}
      </div>
    </section>
  )
}
