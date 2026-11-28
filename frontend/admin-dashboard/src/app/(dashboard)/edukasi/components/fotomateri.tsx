'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Star, Trash2 } from 'lucide-react'
import { Card, Photo } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { PHOTOS } from '@/data/sample'
import { validateEventImage } from '@/data/events'
import { assetUrl } from '@/lib/api'
import { MAX_IMAGES, cultureStore } from './materi'
import type { Culture, CultureImage } from './materi'

/** Nama foto bawaan aplikasi mobile (aset di dalam aplikasi, bukan unggahan). */
const BUILTIN_LABEL: Record<string, string> = {
  wayang: 'Wayang',
  topeng: 'Topeng',
  ketoprak: 'Ketoprak',
  pendopo: 'Pendopo Agung',
  panggung: 'Panggung Terbuka',
  gedung: 'Gedung Kesenian',
  parkir: 'Area Parkir',
  gamelan: 'Gamelan',
  sanggar: 'Latihan Sanggar',
  jaranan: 'Jaranan',
}

/** Satu foto materi: unggahan (URL), foto contoh dashboard, atau kotak nama foto bawaan aplikasi. */
export function FotoMateri({ image, height, alt = '' }: { image?: CultureImage; height: number; alt?: string }) {
  if (image?.url) return <Photo url={assetUrl(image.url)} width="100%" height={height} radius={6} alt={alt} />
  const sample = image?.builtin && PHOTOS[image.builtin]
  if (sample) return <Photo {...sample} width="100%" height={height} radius={6} alt={alt} />
  return (
    <div className="edu-photo-empty" style={{ height }}>
      {image?.builtin ? `Foto bawaan aplikasi · ${BUILTIN_LABEL[image.builtin] ?? image.builtin}` : 'Belum ada foto'}
    </div>
  )
}

/** Panel kelola foto materi terpilih: unggah, jadikan sampul (urutan pertama), hapus. */
export default function KelolaFoto({ topic, canEdit }: { topic: Culture; canEdit: boolean }) {
  const overlay = useOverlay()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const keys = topic.images.map((i) => i.key)

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true)
    try {
      await action()
      overlay.toast(message)
    } catch (err) {
      overlay.toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const onFiles = async (files: FileList | null) => {
    const list = [...(files ?? [])].slice(0, MAX_IMAGES - keys.length)
    if (input.current) input.current.value = ''
    const invalid = list.map((f) => validateEventImage(f)).find(Boolean)
    if (invalid) return overlay.toast(invalid.replace('Gambar', 'Foto').replace('gambar', 'foto'), 'error')
    if (!list.length) return
    // Berurutan agar urutan foto sama dengan urutan pilihan.
    await run(async () => {
      for (const file of list) await cultureStore.uploadImage(topic.id, file)
    }, `${list.length} foto ditambahkan`)
  }

  const makeCover = (key: string) => run(() => cultureStore.setImages(topic.id, [key, ...keys.filter((k) => k !== key)]), 'Sampul materi diganti')

  const remove = (image: CultureImage) =>
    overlay.showDetail({
      title: 'Hapus foto?',
      subtitle: topic.title,
      rows: [
        ['Foto', image.builtin ? `Foto bawaan aplikasi (${BUILTIN_LABEL[image.builtin] ?? image.builtin})` : 'Foto unggahan'],
        ['Catatan', image.builtin ? 'Foto bawaan tetap ada di aplikasi, hanya dilepas dari materi ini.' : 'Berkas foto ikut dihapus dari penyimpanan.'],
      ],
      primaryLabel: 'Hapus',
      success: 'Foto dihapus dari materi',
      onPrimary: () => cultureStore.setImages(topic.id, keys.filter((k) => k !== image.key)),
    })

  return (
    <Card
      title={`Foto materi · ${topic.title}`}
      subtitle={`${keys.length} dari ${MAX_IMAGES} foto · Foto pertama menjadi sampul kartu dan halaman detail; semua foto tampil di tab Foto / Video aplikasi.`}
      action={
        canEdit && (
          <>
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => onFiles(e.target.files)}
            />
            <button className="btn" disabled={busy || keys.length >= MAX_IMAGES} onClick={() => input.current?.click()}>
              <ImagePlus strokeWidth={1.75} /> {busy ? 'Memproses…' : 'Unggah foto'}
            </button>
          </>
        )
      }
    >
      {topic.images.length ? (
        <div className="edu-photos">
          {topic.images.map((image, i) => (
            <figure key={image.key} className="edu-photos__item">
              <FotoMateri image={image} height={120} alt={`${topic.title} ${i + 1}`} />
              <figcaption className="row-actions">
                {i === 0 ? (
                  <span className="pill pill--static">
                    <Star strokeWidth={2} /> Sampul
                  </span>
                ) : (
                  canEdit && (
                    <button className="pill" disabled={busy} onClick={() => makeCover(image.key)}>
                      <Star strokeWidth={2} /> Jadikan sampul
                    </button>
                  )
                )}
                {canEdit && (
                  <button className="pill pill--danger" disabled={busy} onClick={() => remove(image)} aria-label="Hapus foto">
                    <Trash2 strokeWidth={2} /> Hapus
                  </button>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="muted">Belum ada foto. Aplikasi menampilkan sampul polos sampai foto diunggah.</p>
      )}
    </Card>
  )
}
