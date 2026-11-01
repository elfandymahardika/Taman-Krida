'use client'

import { Card, Field, ToggleRow } from '@/components/ui'
import type { FormPengaturan } from './formpengaturan'

/** Metode dan rekening penerimaan pembayaran. */
export default function Pembayaran({ form: { field, toggle, opt } }: { form: FormPengaturan }) {
  return (
    <Card title="Pembayaran" subtitle="Metode dan rekening penerimaan.">
      <Field label="Metode pembayaran" as="select" options={opt.method} {...field('method')} />
      <div className="field-row">
        <Field label="Bank penerima" {...field('bank')} />
        <Field label="Nomor rekening" {...field('account')} />
      </div>
      <div>
        <ToggleRow title="Wajib unggah bukti transfer" subtitle="Pemesan melampirkan bukti sebelum diverifikasi." {...toggle('requireProof')} />
        <ToggleRow title="Pengingat pembayaran otomatis" subtitle="Kirim pengingat 6 jam sebelum batas waktu." {...toggle('autoReminder')} />
      </div>
    </Card>
  )
}
