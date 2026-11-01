'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Card, DetailRow, Field, Photo } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { formatBytes, wibDateTime } from '@/data/format'
import { assetUrl, mutate } from '@/lib/api'
import type { FieldErrors } from '@/lib/api'
import { photoOf } from './koleksimedia'

type Props = {
  media: any
  collections: string[]
  onDeleted: () => void
}

/** Formulir metadata media terpilih + terbitkan/tarik dan hapus. */
export default function MetadataMedia({ media: selected, collections, onDeleted }: Props) {
  const overlay = useOverlay()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)

  const saveMeta = async (e) => {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.currentTarget))
    setBusy(true)
    try {
      await mutate(`/media/${selected.id}`, { method: 'PUT', body: d })
      setErrors({})
      overlay.toast('Metadata media tersimpan')
    } catch (err) {
      setErrors(err.fields ?? {})
      if (!err.fields) overlay.toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const togglePublish = async () => {
    const next = selected.status === 'Draf' ? 'Terpublikasi' : 'Draf'
    try {
      await mutate(`/media/${selected.id}`, { method: 'PATCH', body: { status: next } })
      overlay.toast(next === 'Draf' ? 'Publikasi media ditarik' : 'Media diterbitkan ke galeri publik')
    } catch (err) {
      overlay.toast(err.message, 'error')
    }
  }

  const confirmDelete = () =>
    overlay.showDetail({
      title: 'Hapus media?',
      subtitle: selected.title,
      rows: [
        ['Koleksi', selected.collection],
        ['Berkas', `${selected.type} · ${formatBytes(selected.bytes)}`],
        ['Catatan', selected.url ? 'Berkas di server ikut dihapus dan tidak dapat dikembalikan.' : 'Data media tidak dapat dikembalikan.'],
      ],
      primaryLabel: 'Hapus',
      success: 'Media dihapus',
      onPrimary: async () => {
        await mutate(`/media/${selected.id}`, { method: 'DELETE' })
        onDeleted()
      },
    })

  return (
    <Card title="Metadata media" subtitle={`${selected.type} · ${selected.collection}`}>
      <Photo {...photoOf(selected)} width="100%" height={155} />
      {selected.url && selected.type === 'Video' && (
        <a className="link link--sm" href={assetUrl(selected.url)} target="_blank" rel="noreferrer">
          Putar video di tab baru ↗
        </a>
      )}
      <form
        className="form"
        onSubmit={saveMeta}
        onInput={(e) => {
          const { name } = e.target as HTMLInputElement
          if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }))
        }}
      >
        <Field label="Judul media" name="title" defaultValue={selected.title} error={errors.title} />
        <Field label="Koleksi" name="collection" defaultValue={selected.collection} list="media-collections" error={errors.collection} />
        <datalist id="media-collections">
          {collections.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Field label="Deskripsi" as="textarea" name="description" defaultValue={selected.description} error={errors.description} />
        <div className="field-row">
          <Field label="Kredit foto / video" name="credit" defaultValue={selected.credit} error={errors.credit} />
          <Field label="Tanggal dokumentasi" type="date" name="date" defaultValue={selected.date} error={errors.date} />
        </div>
        <div>
          <DetailRow label="Berkas">
            {formatBytes(selected.bytes)}
            {selected.dims ? ` · ${selected.dims}` : ''}
            {selected.mime ? ` · ${selected.mime}` : ''}
          </DetailRow>
          <DetailRow label="Ditambahkan">{wibDateTime(selected.createdAt)}</DetailRow>
        </div>
        <div className="btn-row">
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan metadata'}
          </button>
          <button type="button" className="btn" onClick={togglePublish}>
            {selected.status === 'Draf' ? 'Terbitkan' : 'Tarik publikasi'}
          </button>
          <button type="button" className="btn btn--danger" onClick={confirmDelete} aria-label="Hapus media">
            <Trash2 strokeWidth={1.75} />
          </button>
        </div>
      </form>
    </Card>
  )
}
