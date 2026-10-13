'use client'

import { useState } from 'react'
import { Check, CheckCircle, Download, Minus, Plus, ShieldCheck, UserX, Users, X } from 'lucide-react'
import { Badge, Card, Cell, DataTable, DetailRow, Field, Filters, Metrics, Note, PageFooter, PageHeader, Period, TableFoot } from '../components/ui'
import { useDownloadReport, useOverlay } from '../components/overlay'

const ROLES = ['Administrator utama', 'Admin Acara', 'Admin Keuangan', 'Admin Sewa', 'Admin Konten']

const STAFF = [
  { id: 'u1', name: 'Admin Pusat', email: 'admin.pusat@tkbj.jatimprov.go.id', role: 'Administrator utama', lastSeen: 'Aktif sekarang', status: 'Aktif' },
  { id: 'u2', name: 'Siti Rahma', email: 'siti.rahma@tkbj.jatimprov.go.id', role: 'Admin Konten', lastSeen: '2 Okt · 08.35', status: 'Aktif' },
  { id: 'u3', name: 'Agus Prasetyo', email: 'agus.p@tkbj.jatimprov.go.id', role: 'Admin Keuangan', lastSeen: '2 Okt · 09.25', status: 'Aktif' },
  { id: 'u4', name: 'Wahyu Hidayat', email: 'wahyu.h@tkbj.jatimprov.go.id', role: 'Admin Sewa', lastSeen: '18 Sep · 15.10', status: 'Nonaktif' },
  { id: 'u5', name: 'Nur Aini', email: 'nur.aini@tkbj.jatimprov.go.id', role: 'Admin Acara', lastSeen: '2 Okt · 09.10', status: 'Aktif' },
  { id: 'u6', name: 'Bayu Kurniawan', email: 'bayu.k@tkbj.jatimprov.go.id', role: 'Admin Acara', lastSeen: '1 Okt · 17.45', status: 'Aktif' },
  { id: 'u7', name: 'Lestari Ayu', email: 'lestari.ayu@tkbj.jatimprov.go.id', role: 'Admin Keuangan', lastSeen: '1 Okt · 16.20', status: 'Aktif' },
]

// y = penuh, p = sebagian / hanya lihat, n = tidak ada akses
const MODULES = ['Acara & tiket', 'Sewa gedung', 'Transaksi', 'Informasi & komunitas', 'Pengguna & pengaturan']
const MATRIX = {
  'Administrator utama': ['y', 'y', 'y', 'y', 'y'],
  'Admin Acara': ['y', 'p', 'n', 'p', 'n'],
  'Admin Keuangan': ['p', 'p', 'y', 'n', 'n'],
  'Admin Sewa': ['p', 'y', 'p', 'n', 'n'],
  'Admin Konten': ['p', 'n', 'n', 'y', 'n'],
}

function Access({ level }) {
  const map = {
    y: { cls: 'check--yes', icon: Check, label: 'Akses penuh' },
    p: { cls: 'check--partial', icon: Minus, label: 'Hanya lihat' },
    n: { cls: 'check--no', icon: X, label: 'Tanpa akses' },
  }[level]
  return (
    <span className={`check ${map.cls}`} title={map.label} aria-label={map.label}>
      <map.icon strokeWidth={2.5} />
    </span>
  )
}

export default function Pengguna() {
  const overlay = useOverlay()
  const download = useDownloadReport()
  const [staff, setStaff] = useState(STAFF)
  const [selectedId, setSelectedId] = useState('u2')
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('Semua peran')
  const [status, setStatus] = useState('Semua status')

  const rows = staff.filter(
    (s) =>
      (role === 'Semua peran' || s.role === role) &&
      (status === 'Semua status' || s.status === status) &&
      `${s.name} ${s.email}`.toLowerCase().includes(query.toLowerCase()),
  )
  const selected = staff.find((s) => s.id === selectedId)
  const active = staff.filter((s) => s.status === 'Aktif').length
  const update = (patch) => setStaff((l) => l.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)))

  return (
    <>
      <PageHeader
        title="Pengguna & peran admin"
        subtitle="Atur akun staf, peran, dan hak akses panel administrator TKBJ."
        actions={
          <>
            <button className="btn" onClick={download}>
              <Download strokeWidth={1.75} /> Unduh laporan
            </button>
            <button
              className="btn btn--primary"
              onClick={() =>
                overlay.showForm({
                  title: 'Undang staf admin',
                  subtitle: 'Undangan aktivasi dikirim ke email staf.',
                  submitLabel: 'Kirim undangan',
                  success: 'Undangan staf berhasil dikirim',
                  onSubmit: (d) =>
                    setStaff((l) => [...l, { id: `u${Date.now()}`, name: d.nama, email: d.email, role: d.peran, lastSeen: 'Belum masuk', status: 'Undangan' }]),
                  fields: [
                    { name: 'nama', label: 'Nama lengkap', required: true },
                    { name: 'email', label: 'Alamat email', type: 'email', required: true, placeholder: 'nama@tkbj.jatimprov.go.id' },
                    { name: 'peran', label: 'Peran', as: 'select', options: ROLES.slice(1) },
                  ],
                })
              }
            >
              <Plus strokeWidth={2} /> Undang staf admin
            </button>
          </>
        }
      />
      <Period />
      <Metrics
        items={[
          { label: 'Total staf admin', icon: Users, value: String(staff.length), hint: 'Seluruh akun panel administrator' },
          { label: 'Peran tersedia', icon: ShieldCheck, value: String(ROLES.length), hint: '1 utama · 4 operasional' },
          { label: 'Akun aktif', icon: CheckCircle, value: String(active), hint: 'Masuk dalam 30 hari terakhir' },
          { label: 'Akun nonaktif', icon: UserX, value: String(staff.filter((s) => s.status === 'Nonaktif').length), hint: 'Tidak dapat masuk ke panel' },
        ]}
      />
      <Filters
        search={{ placeholder: 'Cari nama atau email staf...', value: query, onChange: setQuery }}
        selects={[
          { label: 'Peran', value: role, onChange: setRole, options: ['Semua peran', ...ROLES] },
          { label: 'Status', value: status, onChange: setStatus, options: ['Semua status', 'Aktif', 'Nonaktif', 'Undangan'] },
          { label: 'Urutkan', options: ['Terakhir aktif', 'Nama A–Z'] },
        ]}
      />

      <div className="split">
        <Card title="Daftar pengguna" subtitle="Staf yang memiliki akses ke panel administrator.">
          <DataTable
            columns={[
              { label: 'Nama / email', width: 265, render: (s) => <Cell main={s.name} sub={s.email} /> },
              { label: 'Peran', width: 160, render: (s) => <p>{s.role}</p> },
              { label: 'Terakhir aktif', width: 130, render: (s) => <p>{s.lastSeen}</p> },
              { label: 'Status', width: 90, render: (s) => <Badge>{s.status}</Badge> },
              { label: 'Aksi', width: 70, render: () => <p className="cell__action">Kelola →</p> },
            ]}
            rows={rows}
            getKey={(s) => s.id}
            selected={selectedId}
            onRowClick={(s) => setSelectedId(s.id)}
            footer={<TableFoot>Menampilkan {rows.length} dari {staff.length} staf · Data contoh</TableFoot>}
          />
        </Card>

        {selected && (
          <Card title="Detail staf & akses" subtitle={selected.email} key={selected.id}>
            <div>
              <Badge>{selected.status}</Badge>
            </div>
            <div>
              <DetailRow label="Nama">{selected.name}</DetailRow>
              <DetailRow label="Terakhir aktif">{selected.lastSeen}</DetailRow>
            </div>
            <Field
              label="Peran"
              as="select"
              options={ROLES}
              value={selected.role}
              disabled={selected.role === 'Administrator utama'}
              onChange={(e) => update({ role: e.target.value })}
            />
            <Note>
              Perubahan peran berlaku saat staf masuk berikutnya dan tercatat pada riwayat aktivitas.
            </Note>
            <div className="btn-row">
              <button className="btn btn--primary" onClick={() => overlay.toast('Peran admin diperbarui')}>
                Simpan peran
              </button>
              <button
                className="btn"
                disabled={selected.role === 'Administrator utama'}
                onClick={() => {
                  const next = selected.status === 'Nonaktif' ? 'Aktif' : 'Nonaktif'
                  update({ status: next })
                  overlay.toast(next === 'Aktif' ? 'Akun diaktifkan kembali' : 'Akun dinonaktifkan')
                }}
              >
                {selected.status === 'Nonaktif' ? 'Aktifkan akun' : 'Nonaktifkan akun'}
              </button>
            </div>
          </Card>
        )}
      </div>

      <Card title="Matriks peran & hak akses" subtitle="Ringkasan modul yang dapat dikelola setiap peran.">
        <DataTable
          columns={[
            { label: 'Peran', width: 220, render: (r) => <Cell main={r} sub={`${staff.filter((s) => s.role === r).length} staf`} /> },
            ...MODULES.map((m, i) => ({ label: m, width: 170, render: (r) => <Access level={MATRIX[r][i]} /> })),
          ]}
          rows={ROLES}
          getKey={(r) => r}
          footer={<TableFoot>✓ akses penuh · – hanya lihat · ✕ tanpa akses</TableFoot>}
        />
      </Card>

      <PageFooter />
    </>
  )
}
