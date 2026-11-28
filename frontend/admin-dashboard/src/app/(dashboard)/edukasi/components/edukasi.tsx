'use client'

import { useState } from 'react'
import { ErrorBanner, Filters, Metrics, PageFooter } from '@/components/ui'
import { useAccess } from '@/lib/access'
import { useQuery } from '@/lib/api'
import Hero from './hero'
import DaftarMateri from './daftarmateri'
import KelolaFoto from './fotomateri'
import VideoMateri from './videomateri'
import { CATEGORIES, CATEGORY_LIST_ID, STATUSES } from './materi'
import type { Culture } from './materi'

const NONE: Culture[] = []

export default function Edukasi() {
  const { data, error, reload } = useQuery<Culture[]>('/culture')
  const topics = data ?? NONE
  const canEdit = useAccess().canEdit('info')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Semua kategori')
  const [status, setStatus] = useState('Semua status')
  const [selectedId, setSelectedId] = useState<string>()

  const categories = [...new Set([...topics.map((c) => c.category), ...CATEGORIES])]
  const rows = topics.filter(
    (c) =>
      (category === 'Semua kategori' || c.category === category) &&
      (status === 'Semua status' || c.status === status) &&
      `${c.title} ${c.summary}`.toLowerCase().includes(query.toLowerCase()),
  )
  const selected = topics.find((c) => c.id === selectedId) ?? rows[0]
  const published = topics.filter((c) => c.status === 'Terpublikasi')

  return (
    <>
      <Hero />
      <ErrorBanner error={error} onRetry={reload} />
      <Metrics
        items={[
          { label: 'Materi terbit di aplikasi', value: published.length, hint: `dari ${topics.length} materi` },
          { label: 'Draf', value: topics.length - published.length, hint: 'belum tampil di aplikasi' },
          { label: 'Kategori', value: new Set(published.map((c) => c.category)).size, hint: 'chip filter di aplikasi' },
          { label: 'Punya video', value: topics.filter((c) => c.video).length, hint: `${topics.filter((c) => !c.images.length).length} materi tanpa foto` },
        ]}
      />
      <Filters
        search={{ placeholder: 'Cari judul atau ringkasan materi...', value: query, onChange: setQuery }}
        selects={[
          { label: 'Kategori', value: category, onChange: setCategory, options: ['Semua kategori', ...categories] },
          { label: 'Status', value: status, onChange: setStatus, options: ['Semua status', ...STATUSES] },
        ]}
      />

      <DaftarMateri topics={rows} loaded={Boolean(data)} selectedId={selected?.id} onSelect={setSelectedId} canEdit={canEdit} />
      {selected && <KelolaFoto topic={selected} canEdit={canEdit} />}
      {selected && <VideoMateri topic={selected} canEdit={canEdit} />}

      {/* Saran kategori untuk kolom Kategori di formulir materi. */}
      <datalist id={CATEGORY_LIST_ID}>
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <PageFooter />
    </>
  )
}
