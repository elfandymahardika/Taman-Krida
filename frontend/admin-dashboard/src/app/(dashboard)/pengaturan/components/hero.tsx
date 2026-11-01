'use client'

import { RotateCcw, Save } from 'lucide-react'
import { PageHeader, Period } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { wibDateTime } from '@/data/format'
import { mutate } from '@/lib/api'
import type { FormPengaturan } from './formpengaturan'

/** Judul halaman + tombol kembalikan default dan simpan, serta status penyimpanan. */
export default function Hero({ form }: { form: FormPengaturan }) {
  const overlay = useOverlay()
  const { data, s, dirty, busy, save, cancel } = form

  const resetDefault = () =>
    overlay.showDetail({
      title: 'Konfirmasi tindakan',
      subtitle: 'Kembalikan seluruh pengaturan ke nilai bawaan?',
      rows: [['Catatan', 'Perubahan akan tercatat pada riwayat aktivitas.']],
      primaryLabel: 'Ya, lanjutkan',
      success: 'Pengaturan dikembalikan ke default',
      onPrimary: async () => {
        await mutate('/settings/reset', { method: 'POST' })
        cancel()
      },
    })

  return (
    <>
      <PageHeader
        title="Pengaturan"
        subtitle="Atur preferensi panel, notifikasi, kebijakan pemesanan, pembayaran, dan keamanan."
        actions={
          <>
            <button className="btn" disabled={!s} onClick={resetDefault}>
              <RotateCcw strokeWidth={1.75} /> Kembalikan default
            </button>
            <button className="btn btn--primary" onClick={() => save()} disabled={!dirty || busy}>
              <Save strokeWidth={1.75} /> {busy ? 'Menyimpan…' : 'Simpan pengaturan'}
            </button>
          </>
        }
      />
      <Period
        label={!s ? 'Memuat pengaturan…' : dirty ? 'Ada perubahan yang belum disimpan' : 'Semua perubahan tersimpan'}
        stamp={data?.updatedAt ? `Terakhir diubah ${wibDateTime(data.updatedAt)} oleh ${data.updatedBy}` : undefined}
      />
    </>
  )
}
