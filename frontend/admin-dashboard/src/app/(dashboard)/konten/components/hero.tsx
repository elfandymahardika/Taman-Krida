'use client'

import { Plus } from 'lucide-react'
import { PageHeader, Period } from '@/components/ui'
import { BolehUbah } from '@/components/akses'
import { useOverlay } from '@/components/overlay'
import { mutate } from '@/lib/api'
import { TYPES } from './jeniskonten'

/** Judul halaman + tombol tambah konten. */
export default function Hero() {
  const overlay = useOverlay()

  const addContent = () =>
    overlay.showForm({
      title: 'Tambah konten',
      subtitle: 'Konten baru tersimpan sebagai draf atas nama Anda.',
      success: 'Konten ditambahkan sebagai draf',
      onSubmit: (d) => mutate('/contents', { method: 'POST', body: d }),
      fields: [
        { name: 'title', label: 'Judul konten', placeholder: 'Contoh: Jadwal pentas akhir pekan', required: true, maxLength: 120 },
        { name: 'type', label: 'Jenis konten', as: 'select', options: TYPES.slice(1) },
        { name: 'summary', label: 'Isi ringkas', as: 'textarea', placeholder: 'Opsional · maksimal 300 karakter' },
      ],
    })

  return (
    <>
      <PageHeader
        title="Konten"
        subtitle="Kelola banner beranda, berita, pengumuman, dan artikel budaya untuk aplikasi publik."
        actions={
          <BolehUbah module="info">
            <button className="btn btn--primary" onClick={addContent}>
              <Plus strokeWidth={2} /> Tambah konten
            </button>
          </BolehUbah>
        }
      />
      <Period />
    </>
  )
}
