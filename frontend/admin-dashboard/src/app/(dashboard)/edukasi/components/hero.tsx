'use client'

import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui'
import { BolehUbah } from '@/components/akses'
import { useOverlay } from '@/components/overlay'
import { cultureForm } from './materi'

/** Judul halaman + tombol tambah materi. */
export default function Hero() {
  const overlay = useOverlay()

  return (
    <PageHeader
      title="Edukasi Budaya"
      subtitle="Kelola materi di menu Edukasi aplikasi mobile: sejarah, linimasa, filosofi, dan foto. Hanya materi Terpublikasi yang tampil di aplikasi."
      actions={
        <BolehUbah module="info">
          <button className="btn btn--primary" onClick={() => overlay.showForm(cultureForm())}>
            <Plus strokeWidth={2} /> Tambah materi
          </button>
        </BolehUbah>
      }
    />
  )
}
