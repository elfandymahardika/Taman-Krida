'use client'

import { Card, ToggleRow } from '@/components/ui'
import type { FormPengaturan } from './formpengaturan'

/** Sakelar notifikasi di ikon lonceng. */
export default function Notifikasi({ form: { toggle } }: { form: FormPengaturan }) {
  return (
    <Card title="Notifikasi" subtitle="Pemberitahuan di ikon lonceng · langsung berlaku.">
      <div>
        <ToggleRow title="Pembayaran perlu verifikasi" subtitle="Notifikasi saat pembayaran dikonfirmasi." {...toggle('notifyPayment')} />
        <ToggleRow title="Permintaan sewa gedung" subtitle="Notifikasi saat permintaan sewa disetujui." {...toggle('notifyRental')} />
        <ToggleRow title="Pendaftaran komunitas" subtitle="Notifikasi saat komunitas baru disetujui." {...toggle('notifyCommunity')} />
        <ToggleRow title="Ringkasan harian" subtitle="Email ringkasan aktivitas setiap pukul 07.00 WIB (belum aktif)." {...toggle('dailySummary')} />
      </div>
    </Card>
  )
}
