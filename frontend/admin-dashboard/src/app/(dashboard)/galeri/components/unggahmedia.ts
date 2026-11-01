import { useState } from 'react'
import { useOverlay } from '@/components/overlay'
import { formatBytes } from '@/data/format'
import { upload } from '@/lib/api'
import type { FieldErrors } from '@/lib/api'

const MAX_MB = 25
const NEW_COLLECTION = '+ Koleksi baru…'

export type Upload = {
  key: string
  name: string
  size: number
  progress: number
  state: 'uploading' | 'done' | 'error'
  error?: string
  mediaId?: string
  abort: () => void
}

/** Formulir "Unggah media" + daftar unggahan yang sedang/selesai berjalan. */
export function useUnggahMedia({ collections, onUploaded }: { collections: string[]; onUploaded: (id: string) => void }) {
  const overlay = useOverlay()
  const [uploads, setUploads] = useState<Upload[]>([])

  const patchUpload = (key: string, patch: Partial<Upload>) => setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...patch } : u)))

  const startUpload = (file: File, { title, collection, description }: { title: string; collection: string; description: string }) => {
    const key = `${Date.now()}-${file.name}`
    const params = new URLSearchParams({ name: file.name, collection, description })
    if (title) params.set('title', title)
    const job = upload(`/media?${params}`, file, { onProgress: (progress) => patchUpload(key, { progress }) })
    setUploads((list) => [{ key, name: file.name, size: file.size, progress: 0, state: 'uploading', abort: job.abort }, ...list])
    job.promise.then(
      (m) => {
        patchUpload(key, { progress: 100, state: 'done', mediaId: m.id })
        onUploaded(m.id)
        overlay.toast(`${m.title} diunggah sebagai draf`)
      },
      (err) => {
        patchUpload(key, { state: 'error', error: err.message })
        if (err.status) overlay.toast(err.message, 'error')
      },
    )
  }

  const openUpload = () =>
    overlay.showForm({
      title: 'Unggah media',
      subtitle: `Foto (JPG, PNG, WEBP, GIF) atau video (MP4, WEBM, MOV), maksimal ${MAX_MB} MB. Media baru tersimpan sebagai draf.`,
      submitLabel: 'Mulai unggah',
      success: 'Unggahan dimulai — pantau progresnya di "Pengelolaan unggahan"',
      validate: (d) => {
        const errs: FieldErrors = {}
        const f = d.berkas
        if (!f?.size) errs.berkas = 'Pilih berkas foto atau video.'
        else if (!/^(image|video)\//.test(f.type)) errs.berkas = 'Format berkas harus foto atau video.'
        else if (f.size > MAX_MB * 1024 * 1024) errs.berkas = `Ukuran berkas ${formatBytes(f.size)}; maksimal ${MAX_MB} MB.`
        if (d.koleksi === NEW_COLLECTION && !d.koleksiBaru.trim()) errs.koleksiBaru = 'Isi nama koleksi baru.'
        return errs
      },
      onSubmit: (d) =>
        startUpload(d.berkas, {
          title: d.judul.trim(),
          collection: d.koleksi === NEW_COLLECTION ? d.koleksiBaru.trim() : d.koleksi,
          description: d.keterangan.trim(),
        }),
      fields: [
        { name: 'berkas', label: 'Pilih berkas foto / video', type: 'file', accept: 'image/*,video/*', style: { paddingTop: 10 } },
        { name: 'judul', label: 'Judul', placeholder: 'Kosongkan untuk memakai nama berkas' },
        {
          row: [
            { name: 'koleksi', label: 'Koleksi', as: 'select', options: [...collections, NEW_COLLECTION] },
            { name: 'koleksiBaru', label: 'Nama koleksi baru', placeholder: 'Jika memilih koleksi baru' },
          ],
        },
        { name: 'keterangan', label: 'Keterangan', placeholder: 'Contoh: Dokumentasi pentas 2 Oktober' },
      ],
    })

  return {
    uploads,
    openUpload,
    /** Tutup baris unggahan yang sudah selesai/gagal. */
    dismiss: (key: string) => setUploads((list) => list.filter((x) => x.key !== key)),
  }
}
