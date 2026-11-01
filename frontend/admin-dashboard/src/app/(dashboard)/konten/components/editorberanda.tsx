'use client'

import { useState } from 'react'
import { Bold, Italic, Link2, List, Quote } from 'lucide-react'
import { Badge, Card, DetailRow, Field, Photo } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { PHOTOS } from '@/data/sample'
import { shortDate, wibDateTime } from '@/data/format'
import { mutate } from '@/lib/api'
import type { FieldErrors } from '@/lib/api'
import { TYPES } from './jeniskonten'

/** Tombol format: membungkus teks terpilih dengan penanda sederhana. */
const FORMATS = [
  { icon: Bold, label: 'Tebal', before: '**', after: '**' },
  { icon: Italic, label: 'Miring', before: '_', after: '_' },
  { icon: List, label: 'Daftar', before: '\n- ', after: '' },
  { icon: Quote, label: 'Kutipan', before: '\n> ', after: '' },
  { icon: Link2, label: 'Tautan', before: '[', after: '](https://)' },
]

const HERO_FIELDS = ['type', 'status', 'title', 'body', 'cta', 'link']
const pick = (o) => Object.fromEntries(HERO_FIELDS.map((k) => [k, o[k]]))

/** Editor banner beranda + pratinjau langsung di aplikasi mobile. */
export default function EditorBeranda({ heroRow }: { heroRow: any }) {
  const overlay = useOverlay()
  const [draft, setDraft] = useState(null) // null = belum diedit
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const hero = draft ?? pick(heroRow)
  const dirty = Boolean(draft) && JSON.stringify(draft) !== JSON.stringify(pick(heroRow))

  const set = (key: string) => (e) => {
    setDraft({ ...hero, [key]: e.target.value })
    setErrors((x) => ({ ...x, [key]: undefined }))
  }

  const format = ({ before, after }) => {
    const el = document.querySelector<HTMLTextAreaElement>('textarea[name="heroBody"]')
    if (!el) return
    const { selectionStart: s, selectionEnd: e, value } = el
    const body = value.slice(0, s) + before + value.slice(s, e) + after + value.slice(e)
    setDraft({ ...hero, body })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + before.length, e + before.length)
    })
  }

  const saveHero = async (nextStatus: string, message: string) => {
    setBusy(true)
    try {
      await mutate(`/contents/${heroRow.id}`, { method: 'PUT', body: { ...hero, status: nextStatus } })
      setDraft(null)
      setErrors({})
      overlay.toast(message)
    } catch (err) {
      setErrors(err.fields ?? {})
      overlay.toast(err.fields ? Object.values(err.fields)[0] : err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="split split--half">
      <Card title="Editor konten beranda" subtitle="Banner utama yang tampil pertama di aplikasi publik.">
        <div className="field-row">
          <Field label="Jenis konten" as="select" options={TYPES} value={hero.type} onChange={set('type')} />
          <Field label="Status saat ini" value={heroRow.status} readOnly />
        </div>
        <Field label="Judul" value={hero.title} onChange={set('title')} error={errors.title} />
        <div className="editor-tools" role="toolbar" aria-label="Format teks">
          {FORMATS.map((f) => (
            <button key={f.label} type="button" aria-label={f.label} title={f.label} onClick={() => format(f)}>
              <f.icon strokeWidth={1.75} />
            </button>
          ))}
        </div>
        <Field label="Isi konten" as="textarea" name="heroBody" value={hero.body} onChange={set('body')} error={errors.body} hint={`${hero.body.length}/1000 karakter`} />
        <div className="field-row">
          <Field label="Teks tombol" value={hero.cta} onChange={set('cta')} error={errors.cta} />
          <Field label="Tautan tujuan" value={hero.link} onChange={set('link')} error={errors.link} placeholder="/agenda atau https://…" />
        </div>
        <div>
          <DetailRow label="Jadwal tayang">
            {heroRow.publishFrom ? `${shortDate(heroRow.publishFrom)} – ${shortDate(heroRow.publishTo)}` : '—'}
          </DetailRow>
          <DetailRow label="Terakhir disimpan">
            {wibDateTime(heroRow.updatedAt)} · {heroRow.author}
          </DetailRow>
        </div>
        <div className="btn-row">
          <button className="btn btn--primary" disabled={busy} onClick={() => saveHero('Terpublikasi', 'Konten beranda diterbitkan')}>
            Simpan &amp; terbitkan
          </button>
          <button className="btn" disabled={busy} onClick={() => saveHero('Draf', 'Draf konten tersimpan')}>
            Simpan draf
          </button>
          <button className="btn" disabled={busy} onClick={() => saveHero('Terjadwal', 'Konten dijadwalkan tayang')}>
            Jadwalkan
          </button>
          {dirty && (
            <button className="btn" disabled={busy} onClick={() => setDraft(null)}>
              Batal
            </button>
          )}
        </div>
      </Card>

      <Card title="Pratinjau beranda" subtitle={dirty ? 'Pratinjau perubahan yang belum disimpan.' : 'Tampilan banner di aplikasi mobile pengunjung.'}>
        <div className="hero-preview">
          <Photo {...PHOTOS.wayang} width="100%" height="100%" radius={0} />
          <div className="hero-preview__overlay">
            <span className="hero-preview__eyebrow">{hero.type}</span>
            <span className="hero-preview__title">{hero.title || 'Judul konten'}</span>
            <span className="hero-preview__sub">{hero.body}</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <button className="btn btn--primary" onClick={() => overlay.toast(`Tautan menuju ${hero.link || '—'}`, 'info')}>
            {hero.cta || 'Teks tombol'} →
          </button>
          <Badge tone={dirty ? 'warning' : undefined}>{dirty ? 'Belum disimpan' : heroRow.status}</Badge>
        </div>
      </Card>
    </div>
  )
}
