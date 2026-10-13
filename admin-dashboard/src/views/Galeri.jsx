'use client'

import { useEffect, useState } from 'react'
import { Download, Folder, Globe, HardDrive, Images, Upload } from 'lucide-react'
import { Badge, Card, DetailRow, Field, Filters, Metrics, PageFooter, PageHeader, Period, Photo, Progress } from '../components/ui'
import { useDownloadReport, useOverlay } from '../components/overlay'
import { PHOTOS } from '../data/sample'

const MEDIA = [
  { id: 'm1', title: 'Pagelaran Wayang Kulit', collection: 'Pertunjukan Oktober', date: '2 Okt 2026', type: 'Foto', photo: 'wayang', status: 'Terpublikasi', credit: 'Dokumentasi TKBJ', size: '2,4 MB · 1920×1080' },
  { id: 'm2', title: 'Tari Topeng Malangan', collection: 'Pertunjukan Oktober', date: '3 Okt 2026', type: 'Foto', photo: 'topeng', status: 'Terpublikasi', credit: 'Sanggar Tari Mekar Sari', size: '3,1 MB · 2048×1365' },
  { id: 'm3', title: 'Ketoprak Guyub Rukun', collection: 'Pertunjukan Oktober', date: '4 Okt 2026', type: 'Foto', photo: 'ketoprak', status: 'Terpublikasi', credit: 'Dokumentasi TKBJ', size: '2,8 MB · 2048×1365' },
  { id: 'm4', title: 'Gladi Wayang Wahyu Budoyo', collection: 'Di balik panggung', date: '1 Okt 2026', type: 'Video', photo: 'wayang', status: 'Draf', credit: 'Admin Konten', size: '48 MB · 1080p · 02.14' },
  { id: 'm5', title: 'Kostum Topeng Panji', collection: 'Koleksi busana', date: '28 Sep 2026', type: 'Foto', photo: 'topeng', status: 'Terpublikasi', credit: 'Sanggar Tari Mekar Sari', size: '1,9 MB · 1600×1067' },
  { id: 'm6', title: 'Panggung Ketoprak Malam', collection: 'Di balik panggung', date: '27 Sep 2026', type: 'Foto', photo: 'ketoprak', status: 'Draf', credit: 'Dokumentasi TKBJ', size: '2,2 MB · 1920×1280' },
]

export default function Galeri() {
  const overlay = useOverlay()
  const download = useDownloadReport()
  const [media, setMedia] = useState(MEDIA)
  const [selectedId, setSelectedId] = useState('m1')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('Semua jenis')
  const [status, setStatus] = useState('Semua status')
  const [collection, setCollection] = useState('Semua koleksi')
  const [upload, setUpload] = useState(73)

  // Simulasi unggahan yang sedang berjalan.
  useEffect(() => {
    if (upload === null || upload >= 100) return
    const t = setTimeout(() => setUpload((u) => Math.min(100, u + 3)), 400)
    return () => clearTimeout(t)
  }, [upload])

  const collections = [...new Set(MEDIA.map((m) => m.collection))]
  const rows = media.filter(
    (m) =>
      (type === 'Semua jenis' || m.type === type) &&
      (status === 'Semua status' || m.status === status) &&
      (collection === 'Semua koleksi' || m.collection === collection) &&
      m.title.toLowerCase().includes(query.toLowerCase()),
  )
  const selected = media.find((m) => m.id === selectedId)
  const update = (patch) => setMedia((list) => list.map((m) => (m.id === selectedId ? { ...m, ...patch } : m)))

  return (
    <>
      <PageHeader
        title="Virtual galeri"
        subtitle="Kurasi foto dan video pertunjukan untuk galeri virtual di aplikasi publik."
        actions={
          <>
            <button className="btn" onClick={download}>
              <Download strokeWidth={1.75} /> Unduh laporan
            </button>
            <button
              className="btn btn--primary"
              onClick={() =>
                overlay.showForm({
                  title: 'Unggah media',
                  success: 'Media berhasil diunggah',
                  onSubmit: () => setUpload(0),
                  fields: [
                    { name: 'berkas', label: 'Pilih berkas foto / video', type: 'file', accept: 'image/*,video/*', style: { paddingTop: 10 } },
                    { name: 'koleksi', label: 'Judul koleksi', as: 'select', options: collections },
                    { name: 'keterangan', label: 'Keterangan', placeholder: 'Contoh: Dokumentasi pentas 2 Oktober' },
                  ],
                })
              }
            >
              <Upload strokeWidth={1.75} /> Unggah media
            </button>
          </>
        }
      />
      <Period />
      <Metrics
        items={[
          { label: 'Total media', icon: Images, value: '128', hint: '112 foto · 16 video' },
          { label: 'Terpublikasi', icon: Globe, value: String(92 + media.filter((m) => m.status === 'Terpublikasi').length), hint: 'Tampil di galeri publik' },
          { label: 'Penyimpanan terpakai', icon: HardDrive, value: '3,2 GB', hint: 'Dari kuota 10 GB' },
          { label: 'Koleksi', icon: Folder, value: '9', hint: '3 koleksi diperbarui bulan ini' },
        ]}
      />
      <Filters
        search={{ placeholder: 'Cari judul media...', value: query, onChange: setQuery }}
        selects={[
          { label: 'Jenis', value: type, onChange: setType, options: ['Semua jenis', 'Foto', 'Video'] },
          { label: 'Status', value: status, onChange: setStatus, options: ['Semua status', 'Terpublikasi', 'Draf'] },
          { label: 'Koleksi', value: collection, onChange: setCollection, options: ['Semua koleksi', ...collections] },
        ]}
      />

      <div className="split">
        <div className="stack">
          <Card
            title="Koleksi media"
            subtitle={`${rows.length} media ditampilkan · Pilih media untuk mengubah metadata.`}
            action={
              <button className="link" onClick={() => overlay.toast('Contoh prototype: menampilkan halaman/tanggal berikutnya')}>
                Lihat semua →
              </button>
            }
          >
            <div className="media-grid">
              {rows.map((m) => (
                <button
                  key={m.id}
                  className={`media-card ${m.id === selectedId ? 'is-selected' : ''}`}
                  onClick={() => setSelectedId(m.id)}
                >
                  <Photo {...PHOTOS[m.photo]} width="100%" height={140} radius={6} />
                  <div className="media-card__meta">
                    <strong>{m.title}</strong>
                    <span>
                      {m.type} · {m.collection} · {m.date}
                    </span>
                  </div>
                  <div>
                    <Badge>{m.status}</Badge>
                  </div>
                </button>
              ))}
            </div>
            {!rows.length && <p className="muted">Tidak ada media untuk filter ini.</p>}
          </Card>

          <Card title="Pengelolaan unggahan" subtitle="Berkas besar diproses sebelum dapat diberi metadata.">
            {upload === null ? (
              <p className="muted">Tidak ada unggahan yang sedang berjalan.</p>
            ) : (
              <div className="upload">
                <div className="upload__info">
                  <p>
                    {upload < 100 ? 'pentas-ludruk-malangan.mp4' : 'pentas-ludruk-malangan.mp4 · selesai'}{' '}
                    <span className="muted">· 124 MB</span>
                  </p>
                  <Progress value={upload} />
                  <p className="muted" style={{ fontSize: 10 }}>
                    {upload}% diproses
                  </p>
                </div>
                <Badge tone={upload < 100 ? 'warning' : 'success'}>{upload < 100 ? 'Diproses' : 'Selesai'}</Badge>
                <button
                  className="btn"
                  onClick={() => {
                    setUpload(null)
                    overlay.toast(upload < 100 ? 'Unggahan dibatalkan' : 'Unggahan ditutup')
                  }}
                >
                  {upload < 100 ? 'Batal' : 'Tutup'}
                </button>
              </div>
            )}
          </Card>
        </div>

        {selected && (
          <Card title="Metadata media" subtitle={`${selected.type} · ${selected.collection}`} key={selected.id}>
            <Photo {...PHOTOS[selected.photo]} width="100%" height={155} />
            <Field label="Judul media" defaultValue={selected.title} name="judul" />
            <Field label="Koleksi" as="select" options={collections} defaultValue={selected.collection} />
            <Field
              label="Deskripsi"
              as="textarea"
              defaultValue={`Dokumentasi ${selected.title.toLowerCase()} di Taman Krida Budaya Jawa Timur.`}
            />
            <Field label="Kredit foto / video" defaultValue={selected.credit} />
            <Field label="Tanggal dokumentasi" defaultValue={selected.date} />
            <div>
              <DetailRow label="Berkas">{selected.size}</DetailRow>
            </div>
            <div className="btn-row">
              <button className="btn btn--primary" onClick={() => overlay.toast('Metadata media tersimpan')}>
                Simpan metadata
              </button>
              <button
                className="btn"
                onClick={() => {
                  const next = selected.status === 'Draf' ? 'Terpublikasi' : 'Draf'
                  update({ status: next })
                  overlay.toast(next === 'Draf' ? 'Publikasi media ditarik' : 'Media diterbitkan')
                }}
              >
                {selected.status === 'Draf' ? 'Terbitkan' : 'Tarik publikasi'}
              </button>
            </div>
          </Card>
        )}
      </div>

      <PageFooter />
    </>
  )
}
