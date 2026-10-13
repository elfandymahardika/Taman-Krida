'use client'

import { useState } from 'react'
import { Clock3, Download, FileText, Plus, Receipt, ReceiptText, Sparkles, Wallet } from 'lucide-react'
import { Badge, Card, Cell, DataTable, DetailRow, Field, Filters, Metrics, Note, PageFooter, PageHeader, Period, TableFoot } from '../components/ui'
import { useDownloadReport, useOverlay } from '../components/overlay'
import { ORDERS } from '../data/sample'

const PROOFS = {
  'SG-1026-0018': { method: 'Transfer Bank Jatim', submitted: '2 Okt · 08.50 WIB', file: 'bukti-sg-0018.jpg · 412 KB', from: 'a.n. Sanggar Mekar Sari' },
  'TK-1026-0127': { method: 'Transfer BRI', submitted: '2 Okt · 07.42 WIB', file: 'bukti-tk-0127.png · 288 KB', from: 'a.n. Budi Santoso' },
}

export default function Transaksi() {
  const overlay = useOverlay()
  const download = useDownloadReport()
  const [orders, setOrders] = useState(ORDERS)
  const [selectedId, setSelectedId] = useState('SG-1026-0018')
  const [note, setNote] = useState('Nominal dan nama pengirim sesuai dengan tagihan sewa.')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('Semua jenis')
  const [status, setStatus] = useState('Semua status')

  const rows = orders.filter(
    (o) =>
      (type === 'Semua jenis' || o.type === type) &&
      (status === 'Semua status' || o.payment === status) &&
      `${o.id} ${o.name}`.toLowerCase().includes(query.toLowerCase()),
  )
  const queue = orders.filter((o) => o.payment === 'Perlu verifikasi')
  const selected = orders.find((o) => o.id === selectedId)
  const proof = PROOFS[selectedId]

  const setPayment = (payment, message) => {
    setOrders((list) => list.map((o) => (o.id === selectedId ? { ...o, payment } : o)))
    overlay.toast(message)
  }

  return (
    <>
      <PageHeader
        title="Transaksi & pembayaran"
        subtitle="Pantau pembayaran tiket dan sewa gedung, lalu verifikasi bukti transfer yang masuk."
        actions={
          <>
            <button className="btn" onClick={download}>
              <Download strokeWidth={1.75} /> Unduh laporan
            </button>
            <button
              className="btn btn--primary"
              onClick={() =>
                overlay.showForm({
                  title: 'Catat pembayaran',
                  success: 'Pembayaran berhasil dicatat',
                  fields: [
                    { name: 'nomor', label: 'Nomor transaksi', placeholder: 'Contoh: TK-1026-0129', required: true },
                    { name: 'nominal', label: 'Nominal (Rp)', type: 'number', min: 0, step: 1000, required: true },
                    { name: 'metode', label: 'Metode pembayaran', as: 'select', options: ['Transfer bank', 'QRIS', 'Tunai di loket'] },
                    { name: 'catatan', label: 'Catatan', placeholder: 'Opsional' },
                  ],
                })
              }
            >
              <Plus strokeWidth={2} /> Catat pembayaran
            </button>
          </>
        }
      />
      <Period />
      <Metrics
        items={[
          { label: 'Pembayaran diterima', icon: Wallet, value: 'Rp42,6 jt', hint: 'Tiket Rp24,3 jt · sewa Rp18,3 jt' },
          { label: 'Perlu verifikasi', icon: ReceiptText, value: '8', hint: 'Bukti transfer menunggu admin keuangan' },
          { label: 'Menunggu bayar', icon: Clock3, value: '5', hint: 'Tagihan aktif belum dibayar' },
          { label: 'Transaksi Oktober', icon: Receipt, value: '214', hint: '196 tiket · 18 sewa gedung' },
        ]}
      />
      <Filters
        search={{ placeholder: 'Cari nomor transaksi atau pemesan...', value: query, onChange: setQuery }}
        selects={[
          { label: 'Jenis', value: type, onChange: setType, options: ['Semua jenis', 'Tiket', 'Sewa gedung'] },
          { label: 'Status', value: status, onChange: setStatus, options: ['Semua status', 'Lunas', 'Perlu verifikasi', 'Menunggu bayar'] },
          { label: 'Metode', options: ['Semua metode', 'Transfer bank', 'QRIS', 'Tunai di loket'] },
        ]}
      />

      <div className="split">
        <div className="stack">
          <Card title="Daftar pembayaran" subtitle="Transaksi terbaru dari tiket pertunjukan dan sewa gedung.">
            <DataTable
              columns={[
                { label: 'Transaksi / pemesan', width: 176, render: (o) => <Cell main={o.id} sub={o.name} /> },
                { label: 'Layanan', width: 225, render: (o) => <Cell main={o.service} sub={o.detail} /> },
                { label: 'Nominal', width: 102, render: (o) => <p>{o.amount}</p> },
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
              onRowClick={(o) => {
                if (PROOFS[o.id]) setSelectedId(o.id)
                else
                  overlay.showDetail({
                    subtitle: o.id,
                    rows: [
                      ['Pemesan', o.name],
                      ['Layanan', o.service],
                      ['Rincian', o.detail],
                      ['Nominal', o.amount],
                      ['Pembayaran', o.payment],
                    ],
                    cancelLabel: 'Tutup',
                  })
              }}
              footer={
                <TableFoot onPage={() => overlay.toast('Contoh prototype: menampilkan halaman/tanggal berikutnya')}>
                  Menampilkan {rows.length} dari 214 transaksi · Data contoh
                </TableFoot>
              }
            />
          </Card>

          <Card
            title="Antrean verifikasi"
            subtitle="Bukti transfer yang perlu diperiksa sebelum tiket atau sewa diaktifkan."
            action={
              <button
                className="link"
                onClick={() =>
                  overlay.showDetail({
                    subtitle: 'Antrean verifikasi',
                    rows: [['Keterangan', '8 pembayaran menunggu pemeriksaan admin keuangan.']],
                    cancelLabel: 'Tutup',
                  })
                }
              >
                Lihat antrean →
              </button>
            }
          >
            <DataTable
              columns={[
                { label: 'Transaksi / pengirim', width: 210, render: (o) => <Cell main={o.id} sub={o.name} /> },
                { label: 'Bukti diunggah', width: 180, render: (o) => <p>{PROOFS[o.id]?.submitted}</p> },
                { label: 'Nominal', width: 130, render: (o) => <p>{o.amount}</p> },
                { label: 'Aksi', width: 90, render: () => <p className="cell__action">Periksa →</p> },
              ]}
              rows={queue}
              getKey={(o) => o.id}
              selected={selectedId}
              onRowClick={(o) => setSelectedId(o.id)}
              footer={<TableFoot>{queue.length ? `${queue.length} dari 8 antrean ditampilkan · Data contoh` : 'Antrean kosong'}</TableFoot>}
            />
          </Card>
        </div>

        {selected && proof && (
          <Card title="Verifikasi pembayaran" subtitle={`${selected.id} · ${selected.name}`}>
            <div>
              <Badge>{selected.payment}</Badge>
            </div>
            <div>
              <DetailRow label="Layanan">{selected.service}</DetailRow>
              <DetailRow label="Metode">{proof.method}</DetailRow>
            </div>
            <div className="receipt">
              <p className="receipt__type">Bukti transfer</p>
              <p className="receipt__title">{proof.method}</p>
              <p className="receipt__amount">{selected.amount}</p>
              <div className="divider" />
              <p className="muted" style={{ fontSize: 11 }}>
                {proof.from} · Diunggah {proof.submitted}
              </p>
              <button className="receipt__file" onClick={() => overlay.toast('Contoh prototype: membuka lampiran', 'info')}>
                <FileText strokeWidth={1.75} /> {proof.file}
              </button>
            </div>
            <Note>Nominal sesuai tagihan. Cocokkan nama pengirim dan tanggal mutasi rekening sebelum memverifikasi.</Note>
            <Field label="Catatan verifikasi" as="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="btn-row">
              <button className="btn btn--primary" onClick={() => setPayment('Lunas', 'Pembayaran terverifikasi')}>
                Verifikasi lunas
              </button>
              <button className="btn" onClick={() => setPayment('Menunggu bayar', 'Permintaan bukti ulang terkirim')}>
                Minta ulang
              </button>
            </div>
            <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
              Tampilan verifikasi statis · Tidak memproses dana nyata.
            </p>
            <div className="ai-plan">
              <p className="ai-plan__head">
                <Sparkles strokeWidth={1.75} /> Rencana fitur AI · Pemeriksa bukti transfer
              </p>
              <p>
                Tahap berikutnya, AI akan membaca foto bukti transfer (OCR), lalu mencocokkan nominal, nama pengirim,
                dan tanggal dengan tagihan. Hasilnya berupa saran keputusan dan skor keyakinan. Keputusan akhir tetap
                di tangan admin.
              </p>
              <ul>
                <li>Contoh saran: “Cocok 96% · nominal &amp; nama sesuai”</li>
                <li>Menandai bukti yang diedit atau dipakai ulang</li>
              </ul>
              <Badge tone="neutral">Belum aktif · rancangan</Badge>
            </div>
          </Card>
        )}
      </div>

      <PageFooter />
    </>
  )
}
