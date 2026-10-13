'use client'

import { useState } from 'react'
import { Eye, ParkingSquare, Save } from 'lucide-react'
import { Badge, Card, DetailRow, Field, PageFooter, PageHeader, Period, Photo, Tabs } from '../components/ui'
import { useOverlay } from '../components/overlay'
import { PHOTOS } from '../data/sample'

const INITIAL = {
  name: 'Taman Krida Budaya Jawa Timur',
  manager: 'Dinas Kebudayaan dan Pariwisata Provinsi Jawa Timur',
  address: 'Jl. Soekarno-Hatta No. 7, Kota Malang',
  phone: '(0341) 491 234',
  whatsapp: '0812-3300-1977',
  hours: 'Setiap hari · 08.00–22.00 WIB',
  about:
    'Pusat kegiatan seni dan budaya Jawa Timur yang menyediakan ruang pertunjukan, pameran, dan latihan bagi komunitas.',
}

const AREAS = [
  { id: 'pendopo', name: 'Pendopo Agung TKBJ', desc: 'Kapasitas 300 orang · Pertunjukan tradisi', photo: 'wayang' },
  { id: 'panggung', name: 'Panggung Terbuka', desc: 'Kapasitas 500 orang · Pentas luar ruang', photo: 'topeng' },
  { id: 'galeri', name: 'Gedung Kesenian & Galeri', desc: 'Kapasitas 120 orang · Pameran dan lokakarya', photo: 'ketoprak' },
  { id: 'loket', name: 'Area Loket & Parkir', desc: 'Pintu masuk utama · Loket tiket', photo: null },
]

export default function Profil() {
  const overlay = useOverlay()
  const [tab, setTab] = useState('Semua bagian')
  const [form, setForm] = useState(INITIAL)
  const [saved, setSaved] = useState(INITIAL)
  const [activeArea, setActiveArea] = useState('pendopo')
  const dirty = JSON.stringify(form) !== JSON.stringify(saved)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const save = () => {
    setSaved(form)
    overlay.toast('Profil TKBJ berhasil disimpan')
  }

  const showProfile = tab !== 'Fasilitas & denah'
  const showAreas = tab !== 'Profil lembaga'

  const editArea = (a) =>
    overlay.showForm({
      title: a ? 'Edit area' : 'Tambah area',
      subtitle: a?.name,
      success: a ? 'Data area berhasil diperbarui' : 'Data area berhasil ditambahkan',
      fields: [
        { name: 'nama', label: 'Nama area / fasilitas', defaultValue: a?.name, placeholder: 'Contoh: Pendopo Agung TKBJ', required: true },
        { name: 'kapasitas', label: 'Kapasitas', type: 'number', min: 0, placeholder: 'Jumlah orang' },
        { name: 'fungsi', label: 'Fungsi utama', defaultValue: a?.desc.split(' · ')[1], placeholder: 'Contoh: Pertunjukan tradisi' },
        { name: 'catatan', label: 'Catatan', placeholder: 'Opsional' },
      ],
    })

  return (
    <>
      <PageHeader
        title="Profil & denah"
        subtitle="Perbarui informasi lembaga, fasilitas, dan denah area yang tampil di aplikasi publik."
        actions={
          <>
            <button className="btn" onClick={() => overlay.toast('Tampilan publik ada di halaman "📱 Aplikasi Mobile (Pengguna)"', 'info')}>
              <Eye strokeWidth={1.75} /> Pratinjau publik
            </button>
            <button className="btn btn--primary" onClick={save}>
              <Save strokeWidth={1.75} /> Simpan perubahan
            </button>
          </>
        }
      />
      <Period label="Terakhir diperbarui 28 September 2026" />
      <Tabs items={['Semua bagian', 'Profil lembaga', 'Fasilitas & denah']} value={tab} onChange={setTab} size="lg" />

      {showProfile && (
        <div className="split split--half">
          <Card title="Editor informasi TKBJ" subtitle="Informasi ini tampil di halaman profil aplikasi publik.">
            <Field label="Nama lembaga" value={form.name} onChange={set('name')} />
            <Field label="Pengelola" value={form.manager} onChange={set('manager')} />
            <Field label="Alamat" value={form.address} onChange={set('address')} />
            <div className="field-row">
              <Field label="Telepon" value={form.phone} onChange={set('phone')} />
              <Field label="WhatsApp layanan" value={form.whatsapp} onChange={set('whatsapp')} />
            </div>
            <Field label="Jam layanan" value={form.hours} onChange={set('hours')} />
            <Field label="Deskripsi singkat" as="textarea" value={form.about} onChange={set('about')} />
            <div className="btn-row">
              <button className="btn btn--primary" onClick={save} disabled={!dirty}>
                Simpan perubahan
              </button>
              <button className="btn" onClick={() => setForm(saved)}>
                Batal
              </button>
            </div>
          </Card>

          <Card title="Pratinjau informasi publik" subtitle="Tampilan ringkas seperti di aplikasi pengunjung.">
            <Photo {...PHOTOS.wayang} width="100%" height={180} />
            <p style={{ fontSize: 17, lineHeight: 1.5 }}>{form.name}</p>
            <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
              {form.about}
            </p>
            <div>
              <DetailRow label="Jam layanan">{form.hours}</DetailRow>
              <DetailRow label="Kontak">
                {form.phone} · WA {form.whatsapp}
              </DetailRow>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.5 }}>{form.address}</p>
            <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
              Dikelola oleh {form.manager}
            </p>
            <div>
              <Badge tone={dirty ? 'warning' : 'success'}>{dirty ? 'Belum disimpan' : 'Terpublikasi'}</Badge>
            </div>
          </Card>
        </div>
      )}

      {showAreas && (
        <div className="split" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 504px)' }}>
          <Card
            title="Daftar area & fasilitas"
            subtitle="Area yang dapat dipilih pengunjung dan pemohon sewa."
            action={
              <button className="link" onClick={() => editArea()}>
                Tambah area →
              </button>
            }
          >
            {AREAS.map((a) => (
              <div
                key={a.id}
                className="area-item"
                onMouseEnter={() => setActiveArea(a.id)}
                style={{ background: activeArea === a.id ? 'var(--c-bg)' : undefined, borderRadius: 8, padding: 5 }}
              >
                {a.photo ? (
                  <Photo {...PHOTOS[a.photo]} width={60} height={46} radius={6} />
                ) : (
                  <div className="task__icon" style={{ width: 60, height: 46, borderRadius: 6 }}>
                    <ParkingSquare strokeWidth={1.75} />
                  </div>
                )}
                <div className="area-item__info">
                  <strong>{a.name}</strong>
                  <span>{a.desc}</span>
                </div>
                <button className="link link--sm" onClick={() => editArea(a)}>
                  Edit →
                </button>
              </div>
            ))}
          </Card>

          <Card
            title="Pratinjau denah"
            subtitle="Skema area contoh · Bukan peta geografis"
            action={
              <button
                className="link"
                onClick={() =>
                  overlay.showDetail({
                    subtitle: 'Pratinjau denah',
                    rows: [
                      ['Keterangan', 'Skema area contoh · Bukan peta geografis'],
                      ['Area terpilih', AREAS.find((a) => a.id === activeArea).name],
                    ],
                    cancelLabel: 'Tutup',
                  })
                }
              >
                Perbesar →
              </button>
            }
          >
            <div className="floorplan" aria-label="Skema denah TKBJ">
              {[
                { id: 'galeri', style: { gridColumn: 1, gridRow: 1 } },
                { id: 'loket', style: { gridColumn: 3, gridRow: 1 } },
                { id: 'pendopo', style: { gridColumn: 1, gridRow: 3 } },
                { id: 'panggung', style: { gridColumn: 3, gridRow: 3 } },
              ].map(({ id, style }) => (
                <button
                  key={id}
                  className={`floorplan__area ${activeArea === id ? 'is-active' : ''}`}
                  style={style}
                  onClick={() => setActiveArea(id)}
                >
                  {AREAS.find((a) => a.id === id).name}
                </button>
              ))}
              <div className="floorplan__path" style={{ gridColumn: '1 / 4', gridRow: 2 }} />
              <div className="floorplan__path floorplan__path--v" style={{ gridColumn: 2, gridRow: '1 / 4' }} />
            </div>
            <p className="muted" style={{ fontSize: 10, lineHeight: 1.5 }}>
              Garis kuning = jalur pengunjung · Pilih area untuk menyorot fasilitas.
            </p>
          </Card>
        </div>
      )}

      <PageFooter />
    </>
  )
}
