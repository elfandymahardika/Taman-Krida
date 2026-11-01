'use client'

import { Card, Field } from '@/components/ui'
import type { FormPengaturan } from './formpengaturan'

/** Identitas panel dan preferensi tampilan. */
export default function PengaturanUmum({ form: { field, opt } }: { form: FormPengaturan }) {
  return (
    <Card title="Pengaturan umum" subtitle="Identitas panel dan preferensi tampilan.">
      <Field label="Nama layanan" {...field('serviceName')} />
      <div className="field-row">
        <Field label="Bahasa" as="select" options={opt.language} {...field('language')} />
        <Field label="Zona waktu" as="select" options={opt.timezone} {...field('timezone')} />
      </div>
      <Field label="Email notifikasi sistem" type="email" {...field('email')} />
    </Card>
  )
}
