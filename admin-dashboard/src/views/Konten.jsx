'use client'

import { useState } from 'react'
import { Bold, Download, Italic, Link2, List, Plus, Quote } from 'lucide-react'
import { Badge, Card, Cell, DataTable, DetailRow, Field, Filters, PageFooter, PageHeader, Period, Photo, TableFoot, Tabs } from '../components/ui'
import { useDownloadReport, useOverlay } from '../components/overlay'
import { PHOTOS } from '../data/sample'

const TYPES = ['Banner beranda', 'Berita', 'Pengumuman', 'Artikel budaya']

const CONTENT = [
  { id: 'c1', title: 'Pekan Wayang Oktober di TKBJ', type: 'Banner beranda', author: 'Admin Konten', updated: '2 Okt 2026 · 08.40', status: 'Terpublikasi' },
  { id: 'c2', title: 'Jadwal pentas akhir pekan 2–4 Oktober', type: 'Pengumuman', author: 'Admin Acara', updated: '1 Okt 2026 · 16.15', status: 'Terpublikasi' },
  { id: 'c3', title: 'Mengenal Topeng Malangan dan tokoh Panji', type: 'Artikel budaya', author: 'Siti Rahma', updated: '30 Sep 2026 · 11.02', status: 'Terpublikasi' },
  { id: 'c4', title: 'Pendaftaran Festival Seni Tradisi dibuka', type: 'Berita', author: 'Admin Konten', updated: '2 Okt 2026 · 09.05', status: 'Terjadwal' },
  { id: 'c5', title: 'Penyesuaian jam layanan loket tiket', type: 'Pengumuman', author: 'Admin Pusat', updated: '29 Sep 2026 · 14.30', status: 'Draf' },
  { id: 'c6', title: 'Lokakarya batik Malangan untuk pelajar', type: 'Berita', author: 'Siti Rahma', updated: '28 Sep 2026 · 10.20', status: 'Draf' },
]

export default function Konten() {
  const overlay = useOverlay()
  const download = useDownloadReport()
  const [content, setContent] = useState(CONTENT)
  const [tab, setTab] = useState('Semua')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Semua status')
  const [author, setAuthor] = useState('Semua penulis')
  const [hero, setHero] = useState({
    type: 'Banner beranda',
    status: 'Terpublikasi',
    title: 'Pekan Wayang Oktober di TKBJ',
    body: 'Saksikan pagelaran wayang kulit, tari topeng, dan ketoprak setiap akhir pekan di Taman Krida Budaya Jawa Timur.',
    cta: 'Lihat agenda',
    link: '/agenda',
  })

  const authors = [...new Set(CONTENT.map((c) => c.author))]
  const rows = content.filter(
    (c) =>
      (tab === 'Semua' || c.type === tab) &&
      (status === 'Semua status' || c.status === status) &&
      (author === 'Semua penulis' || c.author === author) &&
      c.title.toLowerCase().includes(query.toLowerCase()),
  )

  const set = (key) => (e) => setHero((h) => ({ ...h, [key]: e.target.value }))
  const saveHero = (nextStatus, message) => {
    setHero((h) => ({ ...h, status: nextStatus }))
    setContent((list) => list.map((c) => (c.id === 'c1' ? { ...c, title: hero.title, status: nextStatus, updated: '2 Okt 2026 · 09.30' } : c)))
    overlay.toast(message)
  }

  const editRow = (c) =>
    overlay.showForm({
      title: 'Edit konten',
      subtitle: c.type,
      success: 'Perubahan konten tersimpan',
      onSubmit: (data) => setContent((list) => list.map((x) => (x.id === c.id ? { ...x, title: data.judul, status: data.status } : x))),
      fields: [
        { name: 'judul', label: 'Judul konten', defaultValue: c.title, required: true },
        { name: 'status', label: 'Status', as: 'select', options: ['Terpublikasi', 'Terjadwal', 'Draf'], defaultValue: c.status },
        { name: 'ringkas', label: 'Isi ringkas', placeholder: 'Opsional' },
      ],
    })

  return (
    <>
      <PageHeader
        title="Konten"
        subtitle="Kelola banner beranda, berita, pengumuman, dan artikel budaya untuk aplikasi publik."
        actions={
          <>
            <button className="btn" onClick={download}>
              <Download strokeWidth={1.75} /> Unduh laporan
            </button>
            <button
              className="btn btn--primary"
              onClick={() =>
                overlay.showForm({
                  title: 'Tambah konten',
                  success: 'Data konten berhasil ditambahkan',
                  onSubmit: (data) =>
                    setContent((list) => [
                      { id: `c${Date.now()}`, title: data.judul, type: data.jenis, author: 'Admin Pusat', updated: '2 Okt 2026 · 09.30', status: 'Draf' },
                      ...list,
                    ]),
                  fields: [
                    { name: 'judul', label: 'Judul konten', placeholder: 'Contoh: Jadwal pentas akhir pekan', required: true },
                    { name: 'jenis', label: 'Jenis konten', as: 'select', options: TYPES },
                    { name: 'ringkas', label: 'Isi ringkas', placeholder: 'Opsional' },
                  ],
                })
              }
            >
              <Plus strokeWidth={2} /> Tambah konten
            </button>
          </>
        }
      />
      <Period />
      <Tabs items={['Semua', ...TYPES]} value={tab} onChange={setTab} size="lg" />
      <Filters
        search={{ placeholder: 'Cari judul konten...', value: query, onChange: setQuery }}
        selects={[
          { label: 'Status', value: status, onChange: setStatus, options: ['Semua status', 'Terpublikasi', 'Terjadwal', 'Draf'] },
          { label: 'Penulis', value: author, onChange: setAuthor, options: ['Semua penulis', ...authors] },
          { label: 'Periode', options: ['Oktober 2026', 'September 2026'] },
        ]}
      />

      <Card title="Daftar konten" subtitle="Konten terbaru di seluruh kanal aplikasi publik.">
        <DataTable
          columns={[
            { label: 'Judul / jenis', width: 370, render: (c) => <Cell main={c.title} sub={c.type} /> },
            { label: 'Penulis', width: 180, render: (c) => <p>{c.author}</p> },
            { label: 'Diperbarui', width: 200, render: (c) => <p>{c.updated}</p> },
            { label: 'Status', width: 135, render: (c) => <Badge>{c.status}</Badge> },
            { label: 'Aksi', width: 130, render: (c) => <p className="cell__action">{c.status === 'Draf' ? 'Edit · Terbitkan →' : 'Edit →'}</p> },
          ]}
          rows={rows}
          getKey={(c) => c.id}
          onRowClick={editRow}
          footer={
            <TableFoot onPage={() => overlay.toast('Contoh prototype: menampilkan halaman/tanggal berikutnya')}>
              Menampilkan {rows.length} dari 34 konten · Data contoh
            </TableFoot>
          }
        />
      </Card>

      <div className="split split--half">
        <Card title="Editor konten beranda" subtitle="Banner utama yang tampil pertama di aplikasi publik.">
          <div className="field-row">
            <Field label="Jenis konten" as="select" options={TYPES} value={hero.type} onChange={set('type')} />
            <Field label="Status" as="select" options={['Terpublikasi', 'Terjadwal', 'Draf']} value={hero.status} onChange={set('status')} />
          </div>
          <Field label="Judul" value={hero.title} onChange={set('title')} />
          <div className="editor-tools" role="toolbar" aria-label="Format teks">
            {[Bold, Italic, List, Quote, Link2].map((Icon, i) => (
              <button key={i} type="button" aria-label="Format" onClick={() => overlay.toast('Contoh prototype: format teks', 'info')}>
                <Icon strokeWidth={1.75} />
              </button>
            ))}
          </div>
          <Field label="Isi konten" as="textarea" value={hero.body} onChange={set('body')} />
          <div className="field-row">
            <Field label="Teks tombol" value={hero.cta} onChange={set('cta')} />
            <Field label="Tautan tujuan" value={hero.link} onChange={set('link')} />
          </div>
          <div>
            <DetailRow label="Jadwal tayang">1–31 Oktober 2026</DetailRow>
          </div>
          <div className="btn-row">
            <button className="btn btn--primary" onClick={() => saveHero('Terpublikasi', 'Konten beranda diterbitkan')}>
              Simpan &amp; terbitkan
            </button>
            <button className="btn" onClick={() => saveHero('Draf', 'Draf konten tersimpan')}>
              Simpan draf
            </button>
            <button className="btn" onClick={() => saveHero('Terjadwal', 'Konten dijadwalkan tayang')}>
              Jadwalkan
            </button>
          </div>
        </Card>

        <Card title="Pratinjau beranda" subtitle="Tampilan banner di aplikasi mobile pengunjung.">
          <div className="hero-preview">
            <Photo {...PHOTOS.wayang} width="100%" height="100%" radius={0} />
            <div className="hero-preview__overlay">
              <span className="hero-preview__eyebrow">{hero.type}</span>
              <span className="hero-preview__title">{hero.title || 'Judul konten'}</span>
              <span className="hero-preview__sub">{hero.body}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <button className="btn btn--primary" onClick={() => overlay.toast(`Tautan menuju ${hero.link}`, 'info')}>
              {hero.cta || 'Teks tombol'} →
            </button>
            <Badge>{hero.status}</Badge>
          </div>
        </Card>
      </div>

      <PageFooter />
    </>
  )
}
