'use client'

import { useState } from 'react'
import { ErrorBanner, Filters, PageFooter } from '@/components/ui'
import { useQuery } from '@/lib/api'
import Hero from './hero'
import RingkasanGaleri from './ringkasangaleri'
import KoleksiMedia from './koleksimedia'
import UnggahanMedia from './unggahanmedia'
import MetadataMedia from './metadatamedia'
import { useUnggahMedia } from './unggahmedia'

const NONE = []

export default function Galeri() {
  const mediaQ = useQuery('/media')
  const media = mediaQ.data ?? NONE
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('Semua jenis')
  const [status, setStatus] = useState('Semua status')
  const [collection, setCollection] = useState('Semua koleksi')

  const collections = [...new Set<string>(media.map((m) => m.collection))]
  const filtered = media.filter(
    (m) =>
      (type === 'Semua jenis' || m.type === type) &&
      (status === 'Semua status' || m.status === status) &&
      (collection === 'Semua koleksi' || m.collection === collection) &&
      m.title.toLowerCase().includes(query.toLowerCase()),
  )
  const selected = media.find((m) => m.id === selectedId) ?? filtered[0]
  const uploader = useUnggahMedia({ collections, onUploaded: setSelectedId })

  return (
    <>
      <Hero onUpload={uploader.openUpload} />
      <ErrorBanner error={mediaQ.error} onRetry={mediaQ.reload} />
      <RingkasanGaleri media={media} collections={collections} />
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
          <KoleksiMedia media={filtered} loaded={Boolean(mediaQ.data)} selectedId={selected?.id} onSelect={setSelectedId} />
          <UnggahanMedia uploads={uploader.uploads} onDismiss={uploader.dismiss} />
        </div>

        {selected && (
          <MetadataMedia
            key={`${selected.id}-${selected.title}-${selected.status}`}
            media={selected}
            collections={collections}
            onDeleted={() => setSelectedId(null)}
          />
        )}
      </div>

      <PageFooter />
    </>
  )
}
