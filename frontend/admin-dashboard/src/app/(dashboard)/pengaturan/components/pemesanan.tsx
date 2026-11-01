'use client'

import { Card, Field, ToggleRow } from '@/components/ui'
import type { FormPengaturan } from './formpengaturan'

/** Batas dan kebijakan pemesanan tiket pengunjung. */
export default function Pemesanan({ form: { field, toggle, opt } }: { form: FormPengaturan }) {
  return (
    <Card title="Pemesanan & tiket" subtitle="Batas dan kebijakan pemesanan pengunjung.">
      <div className="field-row">
        <Field label="Maks. tiket per pesanan" type="number" min={1} max={50} {...field('maxTickets')} />
        <Field label="Batas waktu pembayaran" as="select" options={opt.payDeadline} {...field('payDeadline')} />
      </div>
      <Field label="Kebijakan pembatalan" {...field('cancelPolicy')} />
      <div>
        <ToggleRow title="Terbitkan tiket otomatis" subtitle="Tiket dikirim setelah pembayaran terverifikasi." {...toggle('autoIssue')} />
        <ToggleRow title="Daftar tunggu" subtitle="Izinkan antrean saat kuota tiket habis." {...toggle('waitlist')} />
      </div>
    </Card>
  )
}
