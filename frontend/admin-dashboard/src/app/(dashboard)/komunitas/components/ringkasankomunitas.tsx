'use client'

import { Clock3, Globe, Layers, Users } from 'lucide-react'
import { Metrics } from '@/components/ui'

/** Kartu metrik: komunitas terdaftar, menunggu persetujuan, aktif, dan kategori. */
export default function RingkasanKomunitas({ directory, pending }: { directory: any[]; pending: number }) {
  return (
    <Metrics
      items={[
        { label: 'Komunitas terdaftar', icon: Users, value: String(directory.length), hint: 'Seluruh komunitas di direktori' },
        { label: 'Menunggu persetujuan', icon: Clock3, value: String(pending), hint: 'Pendaftaran direktori baru' },
        { label: 'Tampil di aplikasi', icon: Globe, value: String(directory.filter((c) => c.status === 'Aktif').length), hint: 'Profil aktif dan publik' },
        { label: 'Kategori seni', icon: Layers, value: String(new Set(directory.map((c) => c.category)).size), hint: 'Tari, musik, pertunjukan, kriya' },
      ]}
    />
  )
}
