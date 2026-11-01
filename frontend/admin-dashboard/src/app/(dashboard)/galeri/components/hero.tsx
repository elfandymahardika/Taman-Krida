'use client'

import { Upload } from 'lucide-react'
import { PageHeader, Period } from '@/components/ui'
import { BolehUbah } from '@/components/akses'

/** Judul halaman + tombol unggah media. */
export default function Hero({ onUpload }: { onUpload: () => void }) {
  return (
    <>
      <PageHeader
        title="Virtual galeri"
        subtitle="Kurasi foto dan video pertunjukan untuk galeri virtual di aplikasi publik."
        actions={
          <BolehUbah module="info">
            <button className="btn btn--primary" onClick={onUpload}>
              <Upload strokeWidth={1.75} /> Unggah media
            </button>
          </BolehUbah>
        }
      />
      <Period />
    </>
  )
}
