'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock3,
  Download,
  Images,
  ListFilter,
  Plus,
  ReceiptText,
  ShieldCheck,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react'
import { Badge, Card, Cell, DataTable, Metrics, PageFooter, PageHeader, Period, Photo, Tabs } from '../components/ui'
import { useDownloadReport, useOverlay } from '../components/overlay'
import { ORDERS, PHOTOS } from '../data/sample'
import { dayOfWeek, octDay, sortByDate, timeRange, useEvents } from '../data/events'
import { eventDetail, eventForm } from './shared'

const TASKS = [
  { icon: ReceiptText, title: 'Verifikasi pembayaran (8)', sub: 'Bukti transfer tiket & sewa', action: 'Verifikasi →', to: '/transaksi' },
  { icon: Building2, title: 'Tinjau sewa gedung (3)', sub: 'Konfirmasi jadwal & fasilitas', action: 'Tinjau →', to: '/sewa' },
  { icon: Users, title: 'Persetujuan komunitas (2)', sub: 'Pendaftaran direktori baru', action: 'Tinjau →', to: '/komunitas' },
]

const ACTIVITY = [
  { icon: CircleCheck, title: 'Pembayaran tiket dikonfirmasi', sub: 'Admin Keuangan · TK-1026-0128', time: '09.25 WIB' },
  { icon: CalendarCheck, title: 'Agenda Tari Topeng diperbarui', sub: 'Admin Acara · 3 Oktober 2026', time: '09.10 WIB' },
  { icon: Building2, title: 'Permintaan sewa gedung masuk', sub: 'Sanggar Mekar Sari · SG-1026-0018', time: '08.50 WIB' },
  { icon: Images, title: 'Koleksi virtual galeri ditambahkan', sub: 'Admin Konten · 6 foto pertunjukan', time: '08.35 WIB' },
  { icon: ShieldCheck, title: 'Peran admin konten diperbarui', sub: 'Admin Pusat · Siti Rahma', time: '08.15 WIB' },
]

const STATUS_FILTERS = ['Semua status', 'Lunas', 'Perlu verifikasi', 'Menunggu bayar']

export default function Dashboard() {
  const router = useRouter()
  const overlay = useOverlay()
  const download = useDownloadReport()
  const [tab, setTab] = useState('Semua')
  const [status, setStatus] = useState('Semua status')
  const events = useEvents()
  const monthEvents = events.filter(octDay)
  const monthPublished = monthEvents.filter((e) => e.status === 'Terpublikasi').length
  // Agenda terdekat sejak "hari ini" pada data contoh (2 Oktober 2026).
  const upcoming = sortByDate(events).filter((e) => e.date >= '2026-10-02' && e.status === 'Terpublikasi').slice(0, 3)

  const orders = ORDERS.filter(
    (o) => (tab === 'Semua' || o.type === tab) && (status === 'Semua status' || o.payment === status),
  )

  const openOrder = (o) =>
    overlay.showDetail({
      subtitle: o.id,
      rows: [
        ['Pemesan', o.name],
        ['Layanan', o.service],
        ['Rincian', o.detail],
        ['Nominal', o.amount],
        ['Pembayaran', o.payment],
      ],
      primaryLabel: o.payment === 'Perlu verifikasi' ? 'Verifikasi' : 'Tandai selesai',
      success: o.payment === 'Perlu verifikasi' ? 'Pembayaran terverifikasi' : 'Status diperbarui',
    })

  return (
    <>
      <PageHeader
        title="Dashboard administrator"
        subtitle="Pantau layanan budaya, kelola agenda, dan tindak lanjuti pemesanan."
        actions={
          <>
            <button className="btn" onClick={download}>
              <Download strokeWidth={1.75} /> Unduh laporan
            </button>
            <button className="btn btn--primary" onClick={() => overlay.showForm(eventForm(events))}>
              <Plus strokeWidth={2} /> Tambah acara
            </button>
          </>
        }
      />

      <Period label="Ringkasan bulan ini">
        <button
          className="period-picker"
          onClick={() =>
            overlay.showChoice({
              title: 'Pilih periode',
              subtitle: 'Tentukan rentang ringkasan dashboard.',
              options: ['1–31 Oktober 2026', '1–30 September 2026', 'Tahun 2026'],
              value: '1–31 Oktober 2026',
              onChoose: () => overlay.toast('Contoh prototype: menampilkan periode terpilih'),
            })
          }
        >
          <Calendar strokeWidth={1.75} /> 1–31 Oktober 2026 <ChevronDown strokeWidth={1.75} />
        </button>
      </Period>

      <Metrics
        items={[
          { label: 'Acara bulan ini', icon: CalendarDays, value: String(monthEvents.length), hint: `${monthPublished} terpublikasi · ${monthEvents.length - monthPublished} draf` },
          { label: 'Tiket terjual', icon: Ticket, value: '486', hint: 'Dari 800 tiket tersedia' },
          { label: 'Pemesanan gedung', icon: Building2, value: '18', hint: '15 disetujui · 3 perlu ditinjau' },
          { label: 'Pembayaran diterima', icon: Wallet, value: 'Rp42,6 jt', hint: 'Tiket Rp24,3 jt · sewa Rp18,3 jt' },
        ]}
      />

      <div className="split split--stretch">
        <Card
          title="Agenda terdekat"
          subtitle={`Mulai 2 Oktober 2026 · ${upcoming.length} acara terpublikasi`}
          action={
            <Link className="link" href="/acara">
              Kelola kalender →
            </Link>
          }
          style={{ paddingBottom: 12 }}
        >
          <div>
            {upcoming.map((e) => (
              <button key={e.id} className="agenda-item" onClick={() => overlay.showDetail(eventDetail(e, router.push))}>
                <div className="agenda-item__date">
                  <span className="agenda-item__day">{dayOfWeek(e)}</span>
                  <span className={`agenda-item__num ${e.date === '2026-10-02' ? 'is-today' : ''}`}>
                    {e.date.slice(8)}
                  </span>
                </div>
                {e.photo ? (
                  <Photo {...PHOTOS[e.photo]} width={66} height={58} radius={6} />
                ) : (
                  <span className="task__icon" style={{ width: 66, height: 58, borderRadius: 6 }}>
                    <CalendarDays strokeWidth={1.75} />
                  </span>
                )}
                <div className="agenda-item__info">
                  <p className="agenda-item__title">{e.name}</p>
                  <p className="muted" style={{ fontSize: 11 }}>
                    {e.organizer}
                  </p>
                  <p className="muted" style={{ fontSize: 10 }}>
                    {e.venue} · {timeRange(e)}
                  </p>
                </div>
                <div className="agenda-item__status">
                  <Badge tone={e.date === '2026-10-02' ? 'primary' : 'neutral'}>
                    {e.date === '2026-10-02' ? 'Hari ini' : 'Terpublikasi'}
                  </Badge>
                  <span className="muted" style={{ fontSize: 10 }}>
                    {e.quota !== undefined ? `${e.sold ?? 0} / ${e.quota} tiket` : 'Tanpa tiket'}
                  </span>
                </div>
                <ChevronRight strokeWidth={1.75} />
              </button>
            ))}
          </div>
        </Card>

        <Card
          title="Perlu ditindaklanjuti"
          action={<span className="count-pill">13</span>}
          style={{ gap: 19 }}
        >
          <p className="muted" style={{ fontSize: 12, marginTop: -2 }}>
            Prioritaskan permintaan yang menunggu admin.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {TASKS.map((t) => (
              <div className="task" key={t.title}>
                <div className="task__row">
                  <span className="task__icon">
                    <t.icon strokeWidth={1.75} />
                  </span>
                  <div className="task__info">
                    <p className="task__title">{t.title}</p>
                    <p className="task__sub">{t.sub}</p>
                  </div>
                  <Link className="link link--sm" href={t.to}>
                    {t.action}
                  </Link>
                </div>
                <div className="divider" />
              </div>
            ))}
          </div>
          <p className="queue-note">
            <Clock3 strokeWidth={1.75} /> Permintaan terlama: 1 Oktober, 14.20 WIB
          </p>
        </Card>
      </div>

      <div className="split split--stretch">
        <section className="card card--flush">
          <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 19 }}>
            <div className="section-head">
              <div className="section-head__text" style={{ lineHeight: 'normal', gap: 5 }}>
                <h2 className="section-head__title" style={{ margin: 0, fontWeight: 400 }}>
                  Transaksi &amp; pemesanan
                </h2>
                <p className="section-head__sub">Pesanan terbaru dari tiket pertunjukan dan sewa gedung</p>
              </div>
              <Link className="link" href="/transaksi">
                Lihat semua →
              </Link>
            </div>
            <div className="section-head">
              <Tabs items={['Semua', 'Tiket', 'Sewa gedung']} value={tab} onChange={setTab} />
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
          <DataTable
            columns={[
              { label: 'Pesanan / pemesan', width: 176, render: (o) => <Cell size="lg" main={o.id} sub={o.name} /> },
              { label: 'Layanan', width: 225, render: (o) => <Cell size="lg" main={o.service} sub={o.detail} /> },
              { label: 'Nominal', width: 102, render: (o) => <p style={{ fontSize: 12 }}>{o.amount}</p> },
              { label: 'Pembayaran', width: 145, render: (o) => <Badge>{o.payment}</Badge> },
              {
                label: 'Aksi',
                width: 70,
                render: (o) => (
                  <p style={{ fontSize: 10, color: 'var(--c-primary)' }}>
                    {o.payment === 'Perlu verifikasi' ? 'Verifikasi →' : 'Detail →'}
                  </p>
                ),
              },
            ]}
            rows={orders}
            getKey={(o) => o.id}
            onRowClick={openOrder}
          />
          <div className="table__foot">
            <p>
              {orders.length
                ? `Menampilkan ${orders.length} pesanan terbaru · Data contoh`
                : 'Tidak ada pesanan untuk filter ini'}
            </p>
            <p>Terbaru lebih dahulu</p>
          </div>
        </section>

        <Card title="Aktivitas terbaru" subtitle="Jumat, 2 Oktober 2026" style={{ gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 19 }}>
            {ACTIVITY.map((a) => (
              <div className="activity" key={a.title}>
                <span className="activity__icon">
                  <a.icon strokeWidth={1.75} />
                </span>
                <div className="activity__info">
                  <p className="activity__title">{a.title}</p>
                  <p>{a.sub}</p>
                  <p>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <button
            className="link"
            onClick={() => overlay.toast('Contoh prototype: menampilkan halaman/tanggal berikutnya')}
          >
            Lihat seluruh log aktivitas →
          </button>
        </Card>
      </div>

      <PageFooter />
    </>
  )
}
