'use client'

import { useState } from 'react'
import { CalendarDays, Download, Layers, SlidersHorizontal, Ticket, Wallet } from 'lucide-react'
import { Badge, Card, Cell, DataTable, DetailRow, Filters, Metrics, Note, PageFooter, PageHeader, Period, Photo, Progress, TableFoot } from '../components/ui'
import { useDownloadReport, useOverlay } from '../components/overlay'
import { PHOTOS } from '../data/sample'
import { eventStore, formatDate, sortByDate, timeRange, useEvents } from '../data/events'

const TICKET_ORDERS = [
  { id: 'TK-1026-0128', name: 'Rina Wulandari', event: 'Wayang Kulit', eventFull: 'Pagelaran Wayang Kulit', qty: 2, amount: 'Rp100.000', payment: 'Lunas', ticket: 'Tiket aktif', issued: '2 Okt 2026 · 09.25 WIB', codes: 'TK-0128-A · TK-0128-B', checkin: 'Belum digunakan (2 tiket)' },
  { id: 'TK-1026-0127', name: 'Budi Santoso', event: 'Tari Topeng Malangan', eventFull: 'Tari Topeng Malangan', qty: 4, amount: 'Rp200.000', payment: 'Perlu verifikasi', ticket: 'Belum terbit', issued: '—', codes: 'Diterbitkan setelah lunas', checkin: '—' },
  { id: 'TK-1026-0126', name: 'Dewi Lestari', event: 'Ketoprak Guyub Rukun', eventFull: 'Ketoprak Guyub Rukun', qty: 3, amount: 'Rp150.000', payment: 'Lunas', ticket: 'Tiket aktif', issued: '1 Okt 2026 · 20.12 WIB', codes: 'TK-0126-A · B · C', checkin: 'Belum digunakan (3 tiket)' },
]

export default function Tiket() {
  const overlay = useOverlay()
  const download = useDownloadReport()
  const TICKETED = sortByDate(useEvents()).filter((e) => e.quota !== undefined)
  const [orders, setOrders] = useState(TICKET_ORDERS)
  const [selectedId, setSelectedId] = useState('TK-1026-0128')
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('Semua acara')
  const [payFilter, setPayFilter] = useState('Semua pembayaran')
  const [ticketFilter, setTicketFilter] = useState('Semua status tiket')

  const rows = orders.filter(
    (o) =>
      (eventFilter === 'Semua acara' || o.eventFull === eventFilter) &&
      (payFilter === 'Semua pembayaran' || o.payment === payFilter) &&
      (ticketFilter === 'Semua status tiket' || o.ticket === ticketFilter) &&
      `${o.id} ${o.name}`.toLowerCase().includes(query.toLowerCase()),
  )
  const selected = orders.find((o) => o.id === selectedId)

  const inventoryForm = (e) => ({
    title: 'Atur inventori tiket',
    subtitle: e ? e.name : 'Kuota penjualan per acara',
    success: 'Inventori tiket diperbarui',
    validate: (d) => {
      const errors = {}
      const target = TICKETED.find((t) => t.name === d.acara)
      const quota = Number(d.kuota)
      if (!Number.isInteger(quota) || quota < 1) errors.kuota = 'Kuota harus bilangan bulat minimal 1.'
      else if (target && quota < (target.sold ?? 0)) errors.kuota = `Kuota tidak boleh kurang dari tiket terjual (${target.sold}).`
      if (Number(d.harga) < 0) errors.harga = 'Harga tidak boleh negatif.'
      return errors
    },
    onSubmit: (d) => {
      const target = TICKETED.find((t) => t.name === d.acara)
      if (target) eventStore.update(target.id, { ...target, quota: d.kuota })
    },
    fields: [
      { name: 'acara', label: 'Pilih acara', as: 'select', options: TICKETED.map((t) => t.name), defaultValue: e?.name },
      { name: 'kuota', label: 'Kuota tiket', type: 'number', min: 1, defaultValue: e?.quota ?? 300, required: true },
      { name: 'harga', label: 'Harga tiket (Rp)', type: 'number', min: 0, step: 1000, defaultValue: 50000 },
    ],
  })

  const verify = (o) =>
    overlay.showDetail({
      subtitle: o.id,
      rows: [
        ['Pemesan', o.name],
        ['Pertunjukan', o.eventFull],
        ['Jumlah', `${o.qty} tiket · ${o.amount}`],
        ['Pembayaran', o.payment],
        ['Status tiket', o.ticket],
      ],
      primaryLabel: 'Verifikasi',
      success: 'Pembayaran terverifikasi',
      onPrimary: () =>
        setOrders((list) =>
          list.map((x) =>
            x.id === o.id
              ? { ...x, payment: 'Lunas', ticket: 'Tiket aktif', issued: '2 Okt 2026 · 09.30 WIB', codes: 'TK-0127-A · B · C · D', checkin: 'Belum digunakan (4 tiket)' }
              : x,
          ),
        ),
    })

  return (
    <>
      <PageHeader
        title="Tiket pertunjukan"
        subtitle="Pantau kuota, penjualan, pesanan, dan penerbitan tiket untuk setiap pertunjukan."
        actions={
          <>
            <button className="btn" onClick={download}>
              <Download strokeWidth={1.75} /> Unduh laporan
            </button>
            <button className="btn btn--primary" onClick={() => overlay.showForm(inventoryForm())}>
              <SlidersHorizontal strokeWidth={1.75} /> Atur inventori tiket
            </button>
          </>
        }
      />
      <Period />
      <Metrics
        items={[
          { label: 'Tiket terjual', icon: Ticket, value: '486', hint: 'Dari 800 tiket untuk 3 acara' },
          { label: 'Kuota tersisa', icon: Layers, value: '314', hint: 'Kuota penjualan, bukan kapasitas gedung' },
          { label: 'Pembayaran tiket diterima', icon: Wallet, value: 'Rp24,3 jt', hint: 'Bagian dari total Rp42,6 jt' },
          { label: 'Acara dengan tiket', icon: CalendarDays, value: String(TICKETED.length), hint: 'Acara dengan kuota tiket' },
        ]}
      />

      <Card title="Inventori per acara" subtitle="Harga tiket reguler Rp50.000 · Penjualan Oktober 2026">
        <div className="inventory">
          {TICKETED.map((e) => {
            const sold = e.sold ?? 0
            const pct = e.quota ? Math.round((sold / e.quota) * 100) : 0
            return (
              <div className="inventory-card" key={e.id}>
                <div className="inventory-card__id">
                  {e.photo ? (
                    <Photo {...PHOTOS[e.photo]} width={72} height={64} />
                  ) : (
                    <span className="task__icon" style={{ width: 72, height: 64 }}>
                      <Ticket strokeWidth={1.75} />
                    </span>
                  )}
                  <div className="inventory-card__name">
                    <strong>{e.name}</strong>
                    <span>
                      {formatDate(e, false)} · {timeRange(e)}
                    </span>
                  </div>
                </div>
                <div className="inventory-card__count">
                  {sold} / {e.quota}
                  <Badge>{e.status}</Badge>
                </div>
                <Progress value={pct} />
                <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
                  {e.quota - sold} tiket tersisa · {pct}% terjual
                </p>
                <button className="link" onClick={() => overlay.showForm(inventoryForm(e))}>
                  Atur kuota &amp; harga →
                </button>
              </div>
            )
          })}
        </div>
      </Card>

      <Filters
        search={{ placeholder: 'Cari ID pesanan atau pemesan...', value: query, onChange: setQuery }}
        selects={[
          { label: 'Acara', value: eventFilter, onChange: setEventFilter, options: ['Semua acara', ...TICKETED.map((e) => e.name)] },
          { label: 'Pembayaran', value: payFilter, onChange: setPayFilter, options: ['Semua pembayaran', 'Lunas', 'Perlu verifikasi'] },
          { label: 'Status tiket', value: ticketFilter, onChange: setTicketFilter, options: ['Semua status tiket', 'Tiket aktif', 'Belum terbit'] },
        ]}
      />

      <div className="split">
        <Card title="Daftar pesanan tiket" subtitle="Status pembayaran dan tiket ditampilkan terpisah.">
          <DataTable
            columns={[
              { label: 'Pesanan / pemesan', width: 176, render: (o) => <Cell main={o.id} sub={o.name} /> },
              { label: 'Acara / jumlah', width: 180, render: (o) => <Cell main={o.event} sub={`${o.qty} tiket · ${o.amount}`} /> },
              { label: 'Pembayaran', width: 132, render: (o) => <Badge>{o.payment}</Badge> },
              { label: 'Status tiket', width: 125, render: (o) => <Badge>{o.ticket}</Badge> },
              {
                label: 'Aksi',
                width: 80,
                render: (o) => <p className="cell__action">{o.payment === 'Perlu verifikasi' ? 'Tinjau →' : 'Detail →'}</p>,
              },
            ]}
            rows={rows}
            getKey={(o) => o.id}
            selected={selectedId}
            onRowClick={(o) => {
              setSelectedId(o.id)
              if (o.payment === 'Perlu verifikasi') verify(o)
            }}
            footer={
              <TableFoot onPage={() => overlay.toast('Contoh prototype: menampilkan halaman/tanggal berikutnya')}>
                {rows.length} pesanan tiket terbaru, bukan seluruh pesanan · Data contoh
              </TableFoot>
            }
          />
          <Note>
            Tiket diterbitkan setelah pembayaran lunas. Pesanan yang belum diverifikasi tidak menambah angka tiket
            terjual.
          </Note>
        </Card>

        {selected && (
          <Card title="Detail pesanan" subtitle={`${selected.id} · ${selected.name}`}>
            <div>
              <Badge>{selected.payment}</Badge>
            </div>
            <div>
              <DetailRow label="Pertunjukan">{selected.eventFull}</DetailRow>
              <DetailRow label="Tiket">
                {selected.qty} tiket reguler · {selected.amount}
              </DetailRow>
              <DetailRow label="Penerbitan">{selected.issued}</DetailRow>
              <DetailRow label="Kode tiket">{selected.codes}</DetailRow>
              <DetailRow label="Check-in">{selected.checkin}</DetailRow>
            </div>
            <div className="btn-row">
              {selected.payment === 'Lunas' ? (
                <button className="btn btn--primary" onClick={() => overlay.toast('Tiket dikirim ulang ke email pemesan')}>
                  Kirim ulang tiket
                </button>
              ) : (
                <button className="btn btn--primary" onClick={() => verify(selected)}>
                  Verifikasi pembayaran
                </button>
              )}
              <button className="btn" onClick={() => overlay.toast('Laporan berhasil diunduh (PDF)')}>
                Unduh
              </button>
            </div>
            <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
              Tampilan detail statis · Tidak mengirim tiket nyata.
            </p>
          </Card>
        )}
      </div>

      <PageFooter />
    </>
  )
}
