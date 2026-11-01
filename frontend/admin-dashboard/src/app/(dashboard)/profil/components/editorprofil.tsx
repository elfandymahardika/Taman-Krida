'use client'

import { Badge, Card, DetailRow, Field, Photo } from '@/components/ui'
import { PHOTOS } from '@/data/sample'
import type { FormProfil } from './formprofil'

/** Editor informasi lembaga + pratinjau yang ikut berubah saat mengetik. */
export default function EditorProfil({ profil: { form, errors, set, dirty, busy, save, cancel } }: { profil: FormProfil }) {
  return (
    <div className="split split--half">
      <Card title="Editor informasi TKBJ" subtitle="Informasi ini tampil di halaman profil aplikasi publik.">
        <Field label="Nama lembaga" value={form.name} onChange={set('name')} error={errors.name} />
        <Field label="Pengelola" value={form.manager} onChange={set('manager')} error={errors.manager} />
        <Field label="Alamat" value={form.address} onChange={set('address')} error={errors.address} />
        <div className="field-row">
          <Field label="Telepon" value={form.phone} onChange={set('phone')} error={errors.phone} />
          <Field label="WhatsApp layanan" value={form.whatsapp} onChange={set('whatsapp')} error={errors.whatsapp} />
        </div>
        <Field label="Jam layanan" value={form.hours} onChange={set('hours')} error={errors.hours} />
        <Field
          label="Deskripsi singkat"
          as="textarea"
          value={form.about}
          onChange={set('about')}
          error={errors.about}
          hint={`${form.about.length}/500 karakter`}
        />
        <div className="btn-row">
          <button className="btn btn--primary" onClick={save} disabled={!dirty || busy}>
            {busy ? 'Menyimpan…' : 'Simpan perubahan'}
          </button>
          <button className="btn" disabled={!dirty} onClick={cancel}>
            Batal
          </button>
        </div>
      </Card>

      <Card title="Pratinjau informasi publik" subtitle="Tampilan ringkas seperti di aplikasi pengunjung · berubah saat Anda mengetik.">
        <Photo {...PHOTOS.wayang} width="100%" height={180} />
        <p style={{ fontSize: 17, lineHeight: 1.5 }}>{form.name}</p>
        <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
          {form.about}
        </p>
        <div>
          <DetailRow label="Jam layanan">{form.hours}</DetailRow>
          <DetailRow label="Kontak">
            {form.phone} · WA {form.whatsapp}
          </DetailRow>
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.5 }}>{form.address}</p>
        <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
          Dikelola oleh {form.manager}
        </p>
        <div>
          <Badge tone={dirty ? 'warning' : 'success'}>{dirty ? 'Belum disimpan' : 'Terpublikasi'}</Badge>
        </div>
      </Card>
    </div>
  )
}
