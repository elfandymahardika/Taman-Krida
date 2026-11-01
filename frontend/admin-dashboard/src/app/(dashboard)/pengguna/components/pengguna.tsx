'use client'

import { useState } from 'react'
import { ErrorBanner, Filters, PageFooter } from '@/components/ui'
import { useSession } from '@/data/auth'
import { useQuery } from '@/lib/api'
import Hero from './hero'
import RingkasanPengguna from './ringkasanpengguna'
import DaftarPengguna from './daftarpengguna'
import DetailStaf from './detailstaf'
import PersetujuanStaf from './persetujuanstaf'
import MatriksPeran from './matriksperan'

const NONE = []
const SORTS = ['Terakhir aktif', 'Nama A–Z']
const STATUSES = ['Aktif', 'Nonaktif', 'Undangan', 'Menunggu persetujuan', 'Ditolak']
/** Akun hasil registrasi yang diproses lewat Setujui/Tolak. */
const isApplicant = (s) => s.status === 'Menunggu persetujuan' || s.status === 'Ditolak'

export default function Pengguna() {
  const me = useSession()?.user
  const staffQ = useQuery('/users', { refreshInterval: 60000 })
  const rolesQ = useQuery('/users/roles')
  const staff = staffQ.data ?? NONE
  const roles = rolesQ.data?.roles ?? NONE
  const operational = roles.filter((r) => r.key !== 'admin')
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('Semua peran')
  const [status, setStatus] = useState('Semua status')
  const [sort, setSort] = useState(SORTS[0])

  const rows = staff
    .filter(
      (s) =>
        (role === 'Semua peran' || s.role === role) &&
        (status === 'Semua status' || s.status === status) &&
        `${s.name} ${s.email}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => (sort === 'Nama A–Z' ? a.name.localeCompare(b.name) : (b.lastSeenAt ?? '').localeCompare(a.lastSeenAt ?? '')))
  // Default: pendaftaran yang menunggu persetujuan lebih dulu, lalu staf operasional pertama.
  const selected =
    staff.find((s) => s.id === selectedId) ??
    rows.find((s) => s.status === 'Menunggu persetujuan') ??
    rows.find((s) => s.roleKey !== 'admin') ??
    rows[0]

  return (
    <>
      <Hero operational={operational} />
      <ErrorBanner error={staffQ.error} onRetry={staffQ.reload} />
      <RingkasanPengguna staff={staff} roles={roles} operational={operational} />
      <Filters
        search={{ placeholder: 'Cari nama atau email staf...', value: query, onChange: setQuery }}
        selects={[
          { label: 'Peran', value: role, onChange: setRole, options: ['Semua peran', ...roles.map((r) => r.label)] },
          { label: 'Status', value: status, onChange: setStatus, options: ['Semua status', ...STATUSES] },
          { label: 'Urutkan', value: sort, onChange: setSort, options: SORTS },
        ]}
      />

      <div className="split">
        <DaftarPengguna
          rows={rows}
          total={staff.length}
          loaded={Boolean(staffQ.data)}
          meId={me?.id}
          selectedId={selected?.id}
          onSelect={setSelectedId}
        />
        {selected &&
          (isApplicant(selected) ? (
            <PersetujuanStaf key={`${selected.id}-${selected.status}`} staff={selected} operational={operational} />
          ) : (
            <DetailStaf key={selected.id} staff={selected} roles={roles} operational={operational} meId={me?.id} />
          ))}
      </div>

      <MatriksPeran rolesQ={rolesQ} />

      <PageFooter />
    </>
  )
}
