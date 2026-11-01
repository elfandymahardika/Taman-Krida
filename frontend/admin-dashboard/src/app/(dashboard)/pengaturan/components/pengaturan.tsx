'use client'

import { ErrorBanner, Note, PageFooter } from '@/components/ui'
import { useFormPengaturan } from './formpengaturan'
import Hero from './hero'
import PengaturanUmum from './pengaturanumum'
import Notifikasi from './notifikasi'
import Pemesanan from './pemesanan'
import Pembayaran from './pembayaran'
import Keamanan from './keamanan'

export default function Pengaturan() {
  const form = useFormPengaturan()

  return (
    <>
      <Hero form={form} />
      <ErrorBanner error={form.error} onRetry={form.reload} />
      <Note tone="info">
        Pengaturan berlaku untuk seluruh staf admin dan hanya bisa diubah Administrator utama. Yang langsung berlaku di backend:
        sakelar notifikasi, catat log aktivitas, durasi sesi (untuk login berikutnya), dan maks. percobaan masuk. Pengaturan
        pemesanan & pembayaran dipakai aplikasi mobile setelah backend-nya tersedia. Nilai rekening merupakan data contoh.
      </Note>

      {form.s && (
        <>
          <div className="split split--half">
            <PengaturanUmum form={form} />
            <Notifikasi form={form} />
          </div>

          <div className="split split--half">
            <Pemesanan form={form} />
            <Pembayaran form={form} />
          </div>

          <Keamanan form={form} />
        </>
      )}

      <PageFooter />
    </>
  )
}
