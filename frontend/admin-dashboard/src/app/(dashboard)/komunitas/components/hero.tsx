'use client'

import { Plus } from 'lucide-react'
import { PageHeader, Period } from '@/components/ui'
import { BolehUbah, TombolUnduhLaporan } from '@/components/akses'
import { useOverlay } from '@/components/overlay'
import { mutate } from '@/lib/api'

export const CATEGORIES = ['Seni tari tradisional', 'Seni pertunjukan', 'Seni musik', 'Seni kriya']

/** Judul halaman + tombol unduh laporan dan tambah komunitas. */
export default function Hero() {
  const overlay = useOverlay()

  const addCommunity = () =>
    overlay.showForm({
      title: 'Tambah komunitas',
      success: 'Komunitas ditambahkan dan tampil di direktori',
      fields: [
        { name: 'nama', label: 'Nama komunitas', placeholder: 'Contoh: Sanggar Sekar Arum', required: true },
        { name: 'kategori', label: 'Kategori', as: 'select', options: CATEGORIES },
        { name: 'wa', label: 'Kontak WhatsApp', type: 'tel', placeholder: '08xx-xxxx-xxxx' },
        { name: 'catatan', label: 'Catatan', placeholder: 'Opsional' },
      ],
      onSubmit: (d) => mutate('/communities', { method: 'POST', body: { name: d.nama, category: d.kategori, contact: d.wa, note: d.catatan } }),
    })

  return (
    <>
      <PageHeader
        title="Direktori komunitas"
        subtitle="Kelola profil komunitas seni yang tampil di direktori dan tinjau pendaftaran baru."
        actions={
          <>
            <TombolUnduhLaporan />
            <BolehUbah module="info">
              <button className="btn btn--primary" onClick={addCommunity}>
                <Plus strokeWidth={2} /> Tambah komunitas
              </button>
            </BolehUbah>
          </>
        }
      />
      <Period />
    </>
  )
}
