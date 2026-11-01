'use client'

import { Card, DetailRow, Field, ToggleRow } from '@/components/ui'
import { wibDateTime } from '@/data/format'
import type { FormPengaturan } from './formpengaturan'

/** Kebijakan akses akun administrator + tombol simpan khusus keamanan. */
export default function Keamanan({ form: { data, field, toggle, opt, dirty, busy, save, cancel } }: { form: FormPengaturan }) {
  return (
    <Card title="Keamanan" subtitle="Kebijakan akses untuk seluruh akun administrator.">
      <div className="split split--half" style={{ gap: 24 }}>
        <div>
          <ToggleRow title="Verifikasi dua langkah" subtitle="Wajib kode OTP saat masuk dari perangkat baru (belum aktif)." {...toggle('twoFactor')} />
          <ToggleRow title="Catat log aktivitas" subtitle="Simpan riwayat perubahan data di dashboard · langsung berlaku." {...toggle('auditLog')} />
        </div>
        <div className="form" style={{ gap: 12 }}>
          <div className="field-row">
            <Field label="Durasi sesi" as="select" options={opt.session} {...field('session')} hint="Masa berlaku login berikutnya" />
            <Field label="Maks. percobaan masuk" as="select" options={opt.attempts} {...field('attempts')} hint="Lalu dikunci 15 menit" />
          </div>
          <div>
            <DetailRow label="Terakhir diubah">{data.updatedAt ? `${wibDateTime(data.updatedAt)} · ${data.updatedBy}` : '—'}</DetailRow>
          </div>
        </div>
      </div>
      <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" disabled={!dirty} onClick={cancel}>
          Batal
        </button>
        <button className="btn btn--primary" disabled={!dirty || busy} onClick={() => save('Pengaturan keamanan disimpan')}>
          Simpan pengaturan keamanan
        </button>
      </div>
    </Card>
  )
}
