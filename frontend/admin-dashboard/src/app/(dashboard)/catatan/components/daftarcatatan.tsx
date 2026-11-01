'use client'

import { useOptimistic, useTransition } from 'react'
import { Archive, Pencil, Trash2 } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import type { Note } from '@/lib/dal'
import type { ActionState } from '@/lib/schemas'
import { archiveNoteAdminAction, deleteNoteAction } from '../actions'
import FormCatatan from './formcatatan'

type Change = { type: 'delete' | 'archive'; id: number }

const applyChange = (notes: Note[], change: Change) =>
  change.type === 'delete'
    ? notes.filter((n) => n.id !== change.id)
    : notes.map((n) => (n.id === change.id ? { ...n, status: 'Diarsipkan' as const } : n))

const when = (iso: string) => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

/**
 * Daftar catatan dengan Optimistic UI: hapus & arsip langsung terlihat di layar sebelum server selesai.
 * Bila server menolak, React otomatis mengembalikan daftar ke data asli dan pesan error ditampilkan.
 */
export default function DaftarCatatan({
  notes,
  userId,
  isAdmin,
  all,
  editing,
  onEdit,
}: {
  notes: Note[]
  userId: number
  isAdmin: boolean
  all: boolean
  editing: number | null
  onEdit: (id: number | null) => void
}) {
  const overlay = useOverlay()
  const [optimisticNotes, applyOptimistic] = useOptimistic(notes, applyChange)
  const [, startTransition] = useTransition()

  const run = (change: Change, action: () => Promise<ActionState>) =>
    startTransition(async () => {
      applyOptimistic(change)
      const result = await action()
      overlay.toast(result.message ?? (result.success ? 'Berhasil' : 'Gagal'), result.success ? 'success' : 'error')
    })

  const confirmDelete = (n: Note) =>
    overlay.showDetail({
      title: 'Hapus catatan?',
      subtitle: 'Catatan dihapus permanen dan tidak dapat dikembalikan.',
      rows: [
        ['Judul', n.title],
        ['Pemilik', n.owner],
      ],
      cancelLabel: 'Batal',
      primaryLabel: 'Hapus',
      onPrimary: () => run({ type: 'delete', id: n.id }, deleteNoteAction.bind(null, n.id)),
    })

  return (
    <Card title={all ? 'Catatan semua staf' : 'Catatan saya'} subtitle={`${optimisticNotes.length} catatan · terbaru di atas`}>
      {optimisticNotes.length === 0 && <p className="empty-note">Belum ada catatan. Tambahkan lewat formulir di samping.</p>}
      {optimisticNotes.map((n) => {
        const mine = n.userId === userId
        return editing === n.id ? (
          <FormCatatan key={n.id} note={n} onDone={() => onEdit(null)} />
        ) : (
          <article className="note-item" key={n.id}>
            <div className="note-item__head">
              <div>
                <h3 className="note-item__title">{n.title}</h3>
                <p className="note-item__meta">
                  {all && <>{mine ? 'Anda' : n.owner} · </>}Diperbarui {when(n.updatedAt)}
                </p>
              </div>
              <Badge>{n.status}</Badge>
            </div>
            {n.content && <p className="note-item__body">{n.content}</p>}
            <div className="row-actions">
              {(mine || isAdmin) && (
                <>
                  <button className="pill" onClick={() => onEdit(n.id)}>
                    <Pencil strokeWidth={1.75} /> Ubah
                  </button>
                  <button className="pill pill--danger" onClick={() => confirmDelete(n)}>
                    <Trash2 strokeWidth={1.75} /> Hapus
                  </button>
                </>
              )}
              {isAdmin && n.status !== 'Diarsipkan' && (
                <button className="pill" onClick={() => run({ type: 'archive', id: n.id }, archiveNoteAdminAction.bind(null, n.id))}>
                  <Archive strokeWidth={1.75} /> Arsipkan
                </button>
              )}
            </div>
          </article>
        )
      })}
    </Card>
  )
}
