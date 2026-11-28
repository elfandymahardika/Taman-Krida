'use client'

import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { wibDateTime } from '@/data/format'
import { FotoMateri } from './fotomateri'
import { cultureForm, cultureStore } from './materi'
import type { Culture } from './materi'

type Props = {
  /** Materi hasil filter, sesuai urutan tampil di aplikasi. */
  topics: Culture[]
  loaded: boolean
  selectedId?: string
  onSelect: (id: string) => void
  canEdit: boolean
}

/** Kartu materi; klik kartu untuk mengelola fotonya. */
export default function DaftarMateri({ topics, loaded, selectedId, onSelect, canEdit }: Props) {
  const overlay = useOverlay()

  const toggleStatus = async (c: Culture) => {
    const next = c.status === 'Draf' ? 'Terpublikasi' : 'Draf'
    try {
      await cultureStore.setStatus(c.id, next)
      overlay.toast(next === 'Draf' ? 'Materi ditarik dari aplikasi' : 'Materi diterbitkan ke aplikasi')
    } catch (err) {
      overlay.toast((err as Error).message, 'error')
    }
  }

  const confirmDelete = (c: Culture) =>
    overlay.showDetail({
      title: 'Hapus materi?',
      subtitle: c.title,
      rows: [
        ['Kategori', c.category],
        ['Foto & video', `${c.images.length} foto${c.video ? ' + video' : ''} (berkas unggahan ikut dihapus)`],
        ['Catatan', 'Materi hilang dari aplikasi dan tidak dapat dikembalikan. Pilih "Tarik" bila hanya ingin menyembunyikannya.'],
      ],
      primaryLabel: 'Hapus',
      success: 'Materi edukasi dihapus',
      onPrimary: () => cultureStore.remove(c.id),
    })

  return (
    <Card title="Daftar materi" subtitle="Urutan kartu sama dengan urutan di aplikasi (materi terlama di depan). Klik kartu untuk mengelola fotonya.">
      <div className="media-grid">
        {topics.map((c) => (
          <article
            key={c.id}
            className={`media-card edu-card ${c.id === selectedId ? 'is-selected' : ''}`}
            onClick={() => onSelect(c.id)}
          >
            <FotoMateri image={c.images[0]} height={140} alt={c.title} />
            <div className="media-card__meta">
              <strong>{c.title}</strong>
              <span>
                {c.category} · {c.readMinutes} menit baca · {c.images.length} foto{c.video ? ' · video' : ''}
              </span>
              <span>
                Diperbarui {wibDateTime(c.updatedAt)} oleh {c.author}
              </span>
            </div>
            <div className="edu-card__foot">
              <Badge>{c.status}</Badge>
              {canEdit && (
                // Tombol aksi tidak ikut memilih kartu.
                <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="pill" onClick={() => overlay.showForm(cultureForm(c))}>
                    <Pencil strokeWidth={2} /> Edit
                  </button>
                  <button className="pill" onClick={() => toggleStatus(c)}>
                    {c.status === 'Draf' ? <Eye strokeWidth={2} /> : <EyeOff strokeWidth={2} />}
                    {c.status === 'Draf' ? 'Terbitkan' : 'Tarik'}
                  </button>
                  <button className="pill pill--danger" onClick={() => confirmDelete(c)} aria-label={`Hapus ${c.title}`}>
                    <Trash2 strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
      {loaded && !topics.length && <p className="muted">Tidak ada materi untuk filter ini.</p>}
      {!loaded && <p className="muted">Memuat materi…</p>}
    </Card>
  )
}
