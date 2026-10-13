'use client'

import { useState } from 'react'
import { Clock3, Download, Globe, Layers, Plus, Users } from 'lucide-react'
import { Badge, Card, Cell, DataTable, DetailRow, Field, Filters, Metrics, Note, PageFooter, PageHeader, Period, Photo, TableFoot } from '../components/ui'
import { useDownloadReport, useOverlay } from '../components/overlay'
import { PHOTOS } from '../data/sample'

const CATEGORIES = ['Seni tari tradisional', 'Seni pertunjukan', 'Seni musik', 'Seni kriya']

const DIRECTORY = [
  { id: 'wahyu', name: "Paguyuban Wayang 'Wahyu Budoyo'", category: 'Seni pertunjukan', city: 'Kota Malang', members: 42, contact: '0813-3456-2201', photo: 'wayang', status: 'Aktif' },
  { id: 'mekar', name: 'Sanggar Tari Mekar Sari', category: 'Seni tari tradisional', city: 'Kab. Malang', members: 65, contact: '0812-4410-8823', photo: 'topeng', status: 'Aktif' },
  { id: 'guyub', name: "Komunitas Ketoprak 'Guyub Rukun'", category: 'Seni pertunjukan', city: 'Kota Batu', members: 38, contact: '0857-3012-7745', photo: 'ketoprak', status: 'Aktif' },
  { id: 'sekar', name: 'Paguyuban Sekar Laras', category: 'Seni musik', city: 'Kota Malang', members: 27, contact: '0821-3390-1102', photo: 'wayang', status: 'Aktif' },
]

const APPLICATIONS = [
  { id: 'arum', name: 'Sanggar Sekar Arum', category: 'Seni tari tradisional', submitted: '1 Okt · 14.20', status: 'Menunggu persetujuan', leader: 'Endang Sulistyowati', city: 'Kab. Pasuruan', members: '24 anggota aktif', contact: '0812-3344-5566', since: 'Berdiri 2015' },
  { id: 'tunas', name: 'Komunitas Kriya Tunas', category: 'Seni kriya', submitted: '30 Sep · 10.45', status: 'Menunggu persetujuan', leader: 'Rudi Hartono', city: 'Kota Malang', members: '18 anggota aktif', contact: '0856-7788-9900', since: 'Berdiri 2019' },
]

export default function Komunitas() {
  const overlay = useOverlay()
  const download = useDownloadReport()
  const [directory, setDirectory] = useState(DIRECTORY)
  const [applications, setApplications] = useState(APPLICATIONS)
  const [selectedId, setSelectedId] = useState('arum')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Semua kategori')
  const [status, setStatus] = useState('Semua status')
  const [note, setNote] = useState('Profil lengkap. Mohon lampirkan foto kegiatan terbaru sebelum ditampilkan.')

  const list = directory.filter(
    (c) =>
      (category === 'Semua kategori' || c.category === category) &&
      (status === 'Semua status' || c.status === status) &&
      c.name.toLowerCase().includes(query.toLowerCase()),
  )
  const selected = applications.find((a) => a.id === selectedId)
  const pending = applications.filter((a) => a.status === 'Menunggu persetujuan').length

  const decide = (approved) => {
    setApplications((l) => l.map((a) => (a.id === selectedId ? { ...a, status: approved ? 'Disetujui' : 'Ditolak' } : a)))
    if (approved)
      setDirectory((d) => [
        ...d,
        { id: selected.id, name: selected.name, category: selected.category, city: selected.city, members: parseInt(selected.members), contact: selected.contact, photo: 'topeng', status: 'Aktif' },
      ])
    overlay.toast(approved ? 'Komunitas disetujui dan tampil di direktori' : 'Pendaftaran ditolak — catatan admin terkirim')
  }

  const showProfile = (c) =>
    overlay.showDetail({
      subtitle: c.name,
      rows: [
        ['Kategori', c.category],
        ['Domisili', c.city],
        ['Anggota', `${c.members} orang`],
        ['Kontak WhatsApp', c.contact],
        ['Status', c.status],
      ],
      primaryLabel: c.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan',
      success: 'Status diperbarui',
      onPrimary: () =>
        setDirectory((d) => d.map((x) => (x.id === c.id ? { ...x, status: x.status === 'Aktif' ? 'Nonaktif' : 'Aktif' } : x))),
    })

  return (
    <>
      <PageHeader
        title="Direktori komunitas"
        subtitle="Kelola profil komunitas seni yang tampil di direktori dan tinjau pendaftaran baru."
        actions={
          <>
            <button className="btn" onClick={download}>
              <Download strokeWidth={1.75} /> Unduh laporan
            </button>
            <button
              className="btn btn--primary"
              onClick={() =>
                overlay.showForm({
                  title: 'Tambah komunitas',
                  success: 'Data komunitas berhasil ditambahkan',
                  fields: [
                    { name: 'nama', label: 'Nama komunitas', placeholder: 'Contoh: Sanggar Sekar Arum', required: true },
                    { name: 'kategori', label: 'Kategori', as: 'select', options: CATEGORIES },
                    { name: 'wa', label: 'Kontak WhatsApp', type: 'tel', placeholder: '08xx-xxxx-xxxx' },
                    { name: 'catatan', label: 'Catatan', placeholder: 'Opsional' },
                  ],
                })
              }
            >
              <Plus strokeWidth={2} /> Tambah komunitas
            </button>
          </>
        }
      />
      <Period />
      <Metrics
        items={[
          { label: 'Komunitas terdaftar', icon: Users, value: String(44 + directory.length), hint: 'Seluruh komunitas di direktori' },
          { label: 'Menunggu persetujuan', icon: Clock3, value: String(pending), hint: 'Pendaftaran direktori baru' },
          { label: 'Tampil di aplikasi', icon: Globe, value: String(40 + directory.filter((c) => c.status === 'Aktif').length), hint: 'Profil aktif dan publik' },
          { label: 'Kategori seni', icon: Layers, value: '6', hint: 'Tari, musik, pertunjukan, kriya, dll.' },
        ]}
      />
      <Filters
        search={{ placeholder: 'Cari nama komunitas...', value: query, onChange: setQuery }}
        selects={[
          { label: 'Kategori', value: category, onChange: setCategory, options: ['Semua kategori', ...CATEGORIES] },
          { label: 'Status', value: status, onChange: setStatus, options: ['Semua status', 'Aktif', 'Nonaktif'] },
        ]}
      />

      <div className="split">
        <div className="stack">
          <Card title="Daftar komunitas" subtitle={`${list.length} profil ditampilkan · Data contoh`}>
            <div>
              {list.map((c) => (
                <div className="community" key={c.id}>
                  <Photo {...PHOTOS[c.photo]} width={90} height={67} />
                  <div className="community__info">
                    <strong>{c.name}</strong>
                    <span>
                      {c.category} · {c.city}
                    </span>
                    <span>
                      {c.members} anggota · WA {c.contact}
                    </span>
                  </div>
                  <div className="community__side">
                    <Badge>{c.status}</Badge>
                    <button className="link link--sm" onClick={() => showProfile(c)}>
                      Profil →
                    </button>
                  </div>
                </div>
              ))}
              {!list.length && <p className="muted">Tidak ada komunitas untuk filter ini.</p>}
            </div>
          </Card>

          <Card title="Permohonan pendaftaran" subtitle="Komunitas baru yang mengajukan diri ke direktori.">
            <DataTable
              columns={[
                { label: 'Komunitas / kategori', width: 290, render: (a) => <Cell main={a.name} sub={a.category} /> },
                { label: 'Status', width: 190, render: (a) => <Badge>{a.status}</Badge> },
                { label: 'Diajukan', width: 140, render: (a) => <p>{a.submitted}</p> },
                { label: 'Aksi', width: 80, render: () => <p className="cell__action">Tinjau →</p> },
              ]}
              rows={applications}
              getKey={(a) => a.id}
              selected={selectedId}
              onRowClick={(a) => setSelectedId(a.id)}
              footer={<TableFoot>{pending} permohonan menunggu · Data contoh</TableFoot>}
            />
          </Card>
        </div>

        {selected && (
          <Card title="Tinjau profil pendaftar" subtitle={`${selected.name} · Diajukan ${selected.submitted}`}>
            <div>
              <Badge>{selected.status}</Badge>
            </div>
            <div>
              <DetailRow label="Kategori">{selected.category}</DetailRow>
              <DetailRow label="Ketua">{selected.leader}</DetailRow>
              <DetailRow label="Domisili">{selected.city}</DetailRow>
              <DetailRow label="Keanggotaan">{selected.members}</DetailRow>
              <DetailRow label="Kontak WhatsApp">{selected.contact}</DetailRow>
              <DetailRow label="Riwayat">{selected.since}</DetailRow>
            </div>
            <Note>Profil yang disetujui langsung tampil di direktori aplikasi publik.</Note>
            <Field label="Catatan admin" as="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="btn-row">
              <button
                className="btn btn--primary"
                disabled={selected.status !== 'Menunggu persetujuan'}
                onClick={() => decide(true)}
              >
                Setujui &amp; tampilkan
              </button>
              <button
                className="btn"
                disabled={selected.status !== 'Menunggu persetujuan'}
                onClick={() => decide(false)}
              >
                Tolak
              </button>
            </div>
          </Card>
        )}
      </div>

      <PageFooter />
    </>
  )
}
