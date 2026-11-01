'use client'

import { Folder, Globe, HardDrive, Images } from 'lucide-react'
import { Metrics } from '@/components/ui'
import { formatBytes } from '@/data/format'

/** Kartu metrik: jumlah media, terpublikasi, penyimpanan, dan koleksi. */
export default function RingkasanGaleri({ media, collections }: { media: any[]; collections: string[] }) {
  const totalBytes = media.reduce((n, m) => n + m.bytes, 0)
  const photos = media.filter((m) => m.type === 'Foto').length

  return (
    <Metrics
      items={[
        { label: 'Total media', icon: Images, value: String(media.length), hint: `${photos} foto · ${media.length - photos} video` },
        { label: 'Terpublikasi', icon: Globe, value: String(media.filter((m) => m.status === 'Terpublikasi').length), hint: 'Tampil di galeri publik' },
        { label: 'Penyimpanan terpakai', icon: HardDrive, value: formatBytes(totalBytes), hint: 'Total ukuran berkas media' },
        { label: 'Koleksi', icon: Folder, value: String(collections.length), hint: collections.slice(0, 2).join(' · ') || '—' },
      ]}
    />
  )
}
