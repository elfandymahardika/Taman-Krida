'use client'

import { Plus } from 'lucide-react'
import { PageHeader, Period } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { mutate } from '@/lib/api'

/** Judul halaman + tombol undang staf admin (peran operasional). */
export default function Hero({ operational }: { operational: any[] }) {
  const overlay = useOverlay()

  const invite = () =>
    overlay.showForm({
      title: 'Undang staf admin',
      subtitle: 'Akun dibuat dengan status Undangan. Staf dapat masuk setelah menyelesaikan aktivasi.',
      submitLabel: 'Kirim undangan',
      success: 'Undangan staf berhasil dibuat',
      onSubmit: (d) =>
        mutate('/users', {
          method: 'POST',
          body: { name: d.nama, email: d.email, roleKey: operational.find((r) => r.label === d.peran)?.key },
        }),
      fields: [
        { name: 'nama', label: 'Nama lengkap', required: true },
        { name: 'email', label: 'Alamat email', type: 'email', required: true, placeholder: 'nama@tkbj.jatimprov.go.id' },
        { name: 'peran', label: 'Peran', as: 'select', options: operational.map((r) => r.label) },
      ],
    })

  return (
    <>
      <PageHeader
        title="Pengguna & peran admin"
        subtitle="Atur akun staf, peran, dan hak akses panel administrator TKBJ."
        actions={
          <button className="btn btn--primary" onClick={invite} disabled={!operational.length}>
            <Plus strokeWidth={2} /> Undang staf admin
          </button>
        }
      />
      <Period />
    </>
  )
}
