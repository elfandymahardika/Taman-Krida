'use client'

import { useState } from 'react'
import { ErrorBanner, Filters, PageFooter } from '@/components/ui'
import { useQuery } from '@/lib/api'
import Hero, { CATEGORIES } from './hero'
import RingkasanKomunitas from './ringkasankomunitas'
import DaftarKomunitas from './daftarkomunitas'
import PermohonanKomunitas from './permohonankomunitas'
import TinjauPendaftar from './tinjaupendaftar'

const NONE = []

export default function Komunitas() {
  const { data, error, reload } = useQuery('/communities')
  const all = data ?? NONE
  const directory = all.filter((c) => c.status === 'Aktif' || c.status === 'Nonaktif')
  const applications = all.filter((c) => c.appliedAt).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Semua kategori')
  const [status, setStatus] = useState('Semua status')

  const list = directory.filter(
    (c) =>
      (category === 'Semua kategori' || c.category === category) &&
      (status === 'Semua status' || c.status === status) &&
      c.name.toLowerCase().includes(query.toLowerCase()),
  )
  const pending = applications.filter((a) => a.status === 'Menunggu persetujuan')
  const selected = applications.find((a) => a.id === selectedId) ?? pending[0] ?? applications[0]

  return (
    <>
      <Hero />
      <ErrorBanner error={error} onRetry={reload} />
      <RingkasanKomunitas directory={directory} pending={pending.length} />
      <Filters
        search={{ placeholder: 'Cari nama komunitas...', value: query, onChange: setQuery }}
        selects={[
          { label: 'Kategori', value: category, onChange: setCategory, options: ['Semua kategori', ...CATEGORIES] },
          { label: 'Status', value: status, onChange: setStatus, options: ['Semua status', 'Aktif', 'Nonaktif'] },
        ]}
      />

      <div className="split">
        <div className="stack">
          <DaftarKomunitas communities={list} loaded={Boolean(data)} />
          <PermohonanKomunitas applications={applications} pending={pending.length} selectedId={selected?.id} onSelect={setSelectedId} />
        </div>

        {selected && <TinjauPendaftar key={selected.id} application={selected} />}
      </div>

      <PageFooter />
    </>
  )
}
