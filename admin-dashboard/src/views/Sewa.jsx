'use client'

import { useState } from 'react'
import { Building2, CheckCircle, Clock3, Download, Plus, Wallet } from 'lucide-react'
import { Badge, Card, Cell, DataTable, DetailRow, Field, Filters, Metrics, Note, PageFooter, PageHeader, Period, TableFoot } from '../components/ui'
import { useDownloadReport, useOverlay } from '../components/overlay'
import { VENUES } from '../data/events'

const DAYS = ['Jum 02', 'Sab 03', 'Min 04', 'Sen 05', 'Sel 06', 'Rab 07', 'Kam 08']

const FREE = { kind: 'free', label: 'Tersedia', time: '08.00–22.00' }
const EVENT = { kind: 'event', label: 'Acara', time: 'Sore / malam' }

const SCHEDULE = {
  'Pendopo Agung TKBJ': [EVENT, FREE, EVENT, FREE, FREE, { kind: 'event', label: 'Acara', time: '15.00–17.00' }, FREE],
  'Panggung Terbuka': [FREE, EVENT, FREE, FREE, FREE, FREE, FREE],
  'Gedung Kesenian & Galeri': [FREE, FREE, FREE, FREE, { kind: 'review', label: 'Ditinjau', time: '09.00–15.00' }, FREE, FREE],
}

const REQUESTS = [
  { id: 'SG-1026-0016', name: 'Sanggar Cipta Laras', venue: 'Gedung Kesenian & Galeri', when: '6 Okt · 09.00–15.00', approval: 'Perlu ditinjau', submitted: '1 Okt, 14.20 WIB', activity: 'Lokakarya kriya · 80 peserta', date: '6 Okt 2026 · 09.00–15.00', file: 'proposal-kriya.pdf · 1,2 MB' },
  { id: 'SG-1026-0018', name: 'Sanggar Mekar Sari', venue: 'Pendopo Agung TKBJ', when: '10 Okt · Perlu verifikasi', approval: 'Disetujui', submitted: '2 Okt, 08.50 WIB', activity: 'Pentas tari anak · 150 penonton', date: '10 Okt 2026 · 15.00–21.00', file: 'proposal-pentas.pdf · 980 KB' },
  { id: 'SG-1026-0017', name: 'Komunitas Ruang Seni', venue: 'Gedung Kesenian & Galeri', when: '11 Okt · Menunggu bayar', approval: 'Disetujui', submitted: '30 Sep, 10.05 WIB', activity: 'Pameran lukis · 120 pengunjung', date: '11 Okt 2026 · 09.00–17.00', file: 'proposal-pameran.pdf · 2,1 MB' },
  { id: 'SG-1026-0015', name: 'Paguyuban Sekar Laras', venue: 'Pendopo Agung TKBJ', when: '15 Okt · 13.00–17.00', approval: 'Perlu ditinjau', submitted: '1 Okt, 16.40 WIB', activity: 'Gladi karawitan · 40 peserta', date: '15 Okt 2026 · 13.00–17.00', file: 'surat-permohonan.pdf · 640 KB' },
  { id: 'SG-1026-0014', name: 'Sanggar Puspa Budaya', venue: 'Panggung Terbuka', when: '25 Okt · 16.00–20.00', approval: 'Perlu ditinjau', submitted: '2 Okt, 07.55 WIB', activity: 'Festival tari remaja · 200 penonton', date: '25 Okt 2026 · 16.00–20.00', file: 'proposal-festival.pdf · 1,6 MB' },
]

export default function Sewa() {
  const overlay = useOverlay()
  const download = useDownloadReport()
  const [requests, setRequests] = useState(REQUESTS)
  const [selectedId, setSelectedId] = useState('SG-1026-0016')
  const [note, setNote] = useState('Fasilitas sesuai untuk 80 peserta. Konfirmasi kebutuhan meja sebelum disetujui.')
  const [query, setQuery] = useState('')
  const [venue, setVenue] = useState('Semua fasilitas')
  const [approval, setApproval] = useState('Semua persetujuan')

  const rows = requests.filter(
    (r) =>
      (venue === 'Semua fasilitas' || r.venue === venue) &&
      (approval === 'Semua persetujuan' || r.approval === approval) &&
      `${r.id} ${r.name}`.toLowerCase().includes(query.toLowerCase()),
  )
  const selected = requests.find((r) => r.id === selectedId)
  const pending = requests.filter((r) => r.approval === 'Perlu ditinjau').length

  const decide = (approval, message) => {
    setRequests((list) => list.map((r) => (r.id === selectedId ? { ...r, approval } : r)))
    overlay.toast(message)
  }

  return (
    <>
      <PageHeader
        title="Sewa gedung"
        subtitle="Kelola ketersediaan fasilitas dan tinjau permintaan penggunaan ruang budaya."
        actions={
          <>
            <button className="btn" onClick={download}>
              <Download strokeWidth={1.75} /> Unduh laporan
            </button>
            <button
              className="btn btn--primary"
              onClick={() =>
                overlay.showForm({
                  title: 'Tambah pemesanan',
                  success: 'Data pemesanan berhasil ditambahkan',
                  fields: [
                    { name: 'pemesan', label: 'Nama pemesan', placeholder: 'Contoh: Sanggar Mekar Sari', required: true },
                    { name: 'fasilitas', label: 'Fasilitas', as: 'select', options: VENUES },
                    { name: 'tanggal', label: 'Tanggal sewa', type: 'date', required: true },
                    { name: 'catatan', label: 'Catatan', placeholder: 'Opsional' },
                  ],
                })
              }
            >
              <Plus strokeWidth={2} /> Tambah pemesanan
            </button>
          </>
        }
      />
      <Period />
      <Metrics
        items={[
          { label: 'Pemesanan Oktober', icon: Building2, value: '18', hint: 'Seluruh permintaan bulan ini' },
          { label: 'Disetujui', icon: CheckCircle, value: '15', hint: 'Termasuk SG-1026-0018 & 0017' },
          { label: 'Perlu ditinjau', icon: Clock3, value: String(pending), hint: 'Menunggu keputusan admin' },
          { label: 'Pembayaran sewa diterima', icon: Wallet, value: 'Rp18,3 jt', hint: 'Bagian dari total Rp42,6 jt' },
        ]}
      />
      <Filters
        search={{ placeholder: 'Cari pemesan atau ID sewa...', value: query, onChange: setQuery }}
        selects={[
          { label: 'Periode', options: ['2–8 Oktober 2026'] },
          { label: 'Fasilitas', value: venue, onChange: setVenue, options: ['Semua fasilitas', ...VENUES] },
          { label: 'Persetujuan', value: approval, onChange: setApproval, options: ['Semua persetujuan', 'Perlu ditinjau', 'Disetujui', 'Ditolak'] },
        ]}
      />

      <Card
        title="Jadwal & ketersediaan fasilitas"
        subtitle="2–8 Oktober 2026 · Agenda acara turut memblokir jadwal sewa."
        action={
          <button className="link" onClick={() => overlay.toast('Contoh prototype: menampilkan halaman/tanggal berikutnya')}>
            Lihat bulan penuh →
          </button>
        }
      >
        <div className="table-wrap">
          <div className="schedule">
            <span className="schedule__head">Fasilitas</span>
            {DAYS.map((d) => (
              <span key={d} className="schedule__head schedule__head--center">
                {d}
              </span>
            ))}
            {Object.entries(SCHEDULE).map(([facility, slots]) => (
              <div key={facility} style={{ display: 'contents' }}>
                <span className="schedule__facility">{facility}</span>
                {slots.map((s, i) => (
                  <div key={i} className={`slot slot--${s.kind}`}>
                    {s.label}
                    <small>{s.time}</small>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="muted" style={{ fontSize: 10, lineHeight: 1.5 }}>
          Tersedia = tidak ada jadwal contoh · Ditinjau = belum menjadi reservasi yang disetujui
        </p>
      </Card>

      <div className="split">
        <Card title="Daftar permintaan sewa" subtitle="Persetujuan sewa terpisah dari status pembayaran.">
          <DataTable
            columns={[
              { label: 'Permintaan / pemesan', width: 215, render: (r) => <Cell main={r.id} sub={r.name} /> },
              { label: 'Fasilitas & jadwal', width: 260, render: (r) => <Cell main={r.venue} sub={r.when} /> },
              { label: 'Persetujuan', width: 155, render: (r) => <Badge>{r.approval}</Badge> },
              {
                label: 'Aksi',
                width: 85,
                render: (r) => <p className="cell__action">{r.approval === 'Perlu ditinjau' ? 'Tinjau →' : 'Detail →'}</p>,
              },
            ]}
            rows={rows}
            getKey={(r) => r.id}
            selected={selectedId}
            onRowClick={(r) => setSelectedId(r.id)}
            footer={
              <TableFoot onPage={() => overlay.toast('Contoh prototype: menampilkan halaman/tanggal berikutnya')}>
                Menampilkan {rows.length} dari 18 pemesanan · Data contoh
              </TableFoot>
            }
          />
        </Card>

        {selected && (
          <Card title="Tinjau permintaan" subtitle={`${selected.id} · Diajukan ${selected.submitted}`}>
            <div>
              <Badge>{selected.approval}</Badge>
            </div>
            <div>
              <DetailRow label="Pemohon">{selected.name}</DetailRow>
              <DetailRow label="Kegiatan">{selected.activity}</DetailRow>
              <DetailRow label="Fasilitas">{selected.venue}</DetailRow>
              <DetailRow label="Jadwal">{selected.date}</DetailRow>
              <DetailRow label="Lampiran">{selected.file}</DetailRow>
            </div>
            <Note>Tidak ada benturan jadwal contoh. Pembayaran baru diminta setelah persetujuan.</Note>
            <Field label="Catatan admin" as="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="btn-row">
              <button className="btn btn--primary" onClick={() => decide('Disetujui', 'Pengajuan disetujui — notifikasi terkirim')}>
                Setujui
              </button>
              <button className="btn" onClick={() => decide('Ditolak', 'Pengajuan ditolak — catatan admin terkirim')}>
                Tolak
              </button>
              <button
                className="btn"
                onClick={() =>
                  overlay.showDetail({
                    title: 'Berkas Pengajuan',
                    subtitle: 'Dokumen yang diunggah pemohon',
                    rows: [
                      ['KTP penanggung jawab', 'ktp.pdf · 1,2 MB'],
                      ['Surat permohonan', 'surat_permohonan.pdf · 860 KB'],
                      ['Proposal kegiatan', selected.file],
                    ],
                    primaryLabel: 'Tandai Lengkap',
                    success: 'Berkas ditandai lengkap',
                  })
                }
              >
                Tinjau berkas
              </button>
            </div>
          </Card>
        )}
      </div>

      <PageFooter />
    </>
  )
}
