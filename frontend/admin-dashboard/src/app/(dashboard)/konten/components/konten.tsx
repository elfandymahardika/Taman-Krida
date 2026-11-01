'use client'

import { useState } from 'react'
import { ErrorBanner, Filters, PageFooter, Tabs } from '@/components/ui'
import { useQuery } from '@/lib/api'
import Hero from './hero'
import DaftarKonten from './daftarkonten'
import EditorBeranda from './editorberanda'
import { STATUSES, TYPES } from './jeniskonten'

const NONE = []

export default function Konten() {
  const { data, error, reload } = useQuery('/contents')
  const content = data ?? NONE
  const heroRow = content.find((c) => c.isHero)
  const [tab, setTab] = useState('Semua')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Semua status')
  const [author, setAuthor] = useState('Semua penulis')
  const [page, setPage] = useState(0)

  const authors = [...new Set<string>(content.map((c) => c.author))]
  const rows = content.filter(
    (c) =>
      (tab === 'Semua' || c.type === tab) &&
      (status === 'Semua status' || c.status === status) &&
      (author === 'Semua penulis' || c.author === author) &&
      c.title.toLowerCase().includes(query.toLowerCase()),
  )
  const filter = (fn: (v: string) => void) => (v: string) => {
    fn(v)
    setPage(0)
  }

  return (
    <>
      <Hero />
      <ErrorBanner error={error} onRetry={reload} />
      <Tabs items={['Semua', ...TYPES]} value={tab} onChange={filter(setTab)} size="lg" />
      <Filters
        search={{ placeholder: 'Cari judul konten...', value: query, onChange: filter(setQuery) }}
        selects={[
          { label: 'Status', value: status, onChange: filter(setStatus), options: ['Semua status', ...STATUSES] },
          { label: 'Penulis', value: author, onChange: filter(setAuthor), options: ['Semua penulis', ...authors] },
        ]}
      />

      <DaftarKonten contents={rows} loaded={Boolean(data)} page={page} onPage={setPage} />

      {/* Dimuat ulang setiap kali banner disimpan (dari editor atau tabel) sehingga draf ikut direset. */}
      {heroRow && <EditorBeranda key={heroRow.updatedAt} heroRow={heroRow} />}

      <PageFooter />
    </>
  )
}
