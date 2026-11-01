'use client'

import { useCallback, useState } from 'react'
import { Card, ErrorBanner, Filters, PageFooter, PageHeader, Tabs } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { formatBytes } from '@/data/format'
import { useSession } from '@/data/auth'
import { mutate, useQuery } from '@/lib/api'
import AreaUnggah from './areaunggah'
import KartuDokumen from './kartudokumen'
import PratinjauDokumen from './pratinjaudokumen'
import { isImage, isPdf } from './jenisdokumen'
import type { DocumentItem } from './jenisdokumen'

const TABS = ['Semua', 'Gambar', 'PDF'] as const
const NONE: DocumentItem[] = []

/** Halaman Dokumen: unggah, daftar (filter & cari), pratinjau, dan hapus berkas milik sendiri. */
export default function Dokumen() {
  const overlay = useOverlay()
  const isAdmin = useSession()?.user.roleKey === 'admin'
  const { data, error, reload } = useQuery<{ data: DocumentItem[]; limits: { storage: string } }>('/upload/list')
  const docs = data?.data ?? NONE
  const [tab, setTab] = useState<(typeof TABS)[number]>('Semua')
  const [query, setQuery] = useState('')
  const [preview, setPreview] = useState<DocumentItem | null>(null)
  const closePreview = useCallback(() => setPreview(null), [])

  const rows = docs.filter(
    (d) =>
      (tab === 'Semua' || (tab === 'Gambar' ? isImage(d) : isPdf(d))) &&
      `${d.name} ${d.owner ?? ''}`.toLowerCase().includes(query.toLowerCase()),
  )
  const totalBytes = docs.reduce((n, d) => n + d.fileSize, 0)

  const confirmDelete = (doc: DocumentItem) =>
    overlay.showDetail({
      title: 'Hapus dokumen?',
      subtitle: 'Berkas dihapus permanen dari storage dan database.',
      rows: [
        ['Nama berkas', doc.name],
        ['Ukuran', formatBytes(doc.fileSize)],
      ],
      cancelLabel: 'Batal',
      primaryLabel: 'Hapus',
      success: 'Dokumen dihapus',
      onPrimary: () => mutate(`/upload/${doc.id}`, { method: 'DELETE' }),
    })

  return (
    <>
      <PageHeader
        title="Dokumen"
        subtitle={
          isAdmin
            ? 'Berkas kerja staf (surat, proposal, foto). Sebagai Administrator utama Anda melihat dan dapat menghapus dokumen semua staf.'
            : 'Berkas kerja Anda (surat, proposal, foto). Hanya Anda dan Administrator utama yang dapat melihatnya.'
        }
      />
      <ErrorBanner error={error} onRetry={reload} />

      <Card
        title="Unggah berkas"
        subtitle={`${docs.length} dokumen · ${formatBytes(totalBytes || 0)} terpakai${data ? ` · penyimpanan ${data.limits.storage === 'cloud' ? 'cloud' : 'lokal (uploads/)'}` : ''}`}
      >
        <AreaUnggah onUploaded={(name) => overlay.toast(`${name} berhasil diunggah`)} />
      </Card>

      <Tabs<(typeof TABS)[number]> items={TABS} value={tab} onChange={setTab} size="lg" />
      <Filters search={{ placeholder: isAdmin ? 'Cari nama berkas atau pemilik...' : 'Cari nama berkas...', value: query, onChange: setQuery }} />

      {data && rows.length === 0 ? (
        <p className="empty-note">{docs.length ? 'Tidak ada dokumen yang cocok dengan filter.' : 'Belum ada dokumen. Unggah berkas pertama Anda di atas.'}</p>
      ) : (
        <div className="doc-grid">
          {rows.map((d) => (
            <KartuDokumen key={d.id} doc={d} showOwner={isAdmin} onPreview={setPreview} onDelete={confirmDelete} />
          ))}
        </div>
      )}

      <PratinjauDokumen doc={preview} onClose={closePreview} />
      <PageFooter />
    </>
  )
}
