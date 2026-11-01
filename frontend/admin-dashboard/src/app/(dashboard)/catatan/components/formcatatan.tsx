'use client'

import { useActionState, useEffect } from 'react'
import { Field, SectionHead } from '@/components/ui'
import type { Note } from '@/lib/dal'
import { NOTE_STATUSES } from '@/lib/schemas'
import type { ActionState } from '@/lib/schemas'
import { createNoteAction, updateNoteAction } from '../actions'

const initialState: ActionState = {}

/**
 * Form tambah / ubah catatan. Dihubungkan ke Server Action lewat useActionState
 * (state = hasil server, formAction = <form action>, isPending = sedang diproses).
 * Ubah: ID dikirim dengan updateNoteAction.bind(null, id).
 */
export default function FormCatatan({ note, onDone }: { note?: Note; onDone?: () => void }) {
  const action = note ? updateNoteAction.bind(null, note.id) : createNoteAction
  const [state, formAction, isPending] = useActionState(action, initialState)

  // Isian terakhir dikembalikan server saat gagal, supaya form tidak kosong setelah React mereset form.
  const values = state.values ?? { title: note?.title ?? '', content: note?.content ?? '', status: note?.status ?? 'Draf' }
  const errorOf = (key: string) => state.errors?.[key]?.[0]

  useEffect(() => {
    if (state.success) onDone?.()
  }, [state, onDone])

  return (
    <form action={formAction} className={note ? 'note-form note-form--inline' : 'card note-form'} noValidate>
      {!note && <SectionHead title="Tambah catatan" subtitle="Catatan tersimpan atas nama Anda." />}

      {state.message && (
        <div className={`form-msg ${state.success ? 'form-msg--success' : 'form-msg--error'}`} role={state.success ? 'status' : 'alert'}>
          {state.message}
        </div>
      )}

      <Field label="Judul" name="title" placeholder="Contoh: Checklist gladi pentas" defaultValue={values.title} error={errorOf('title')} required />
      <Field
        label="Isi catatan"
        name="content"
        as="textarea"
        rows={4}
        placeholder="Opsional · maksimal 500 karakter"
        defaultValue={values.content}
        error={errorOf('content')}
      />
      <Field label="Status" name="status" as="select" options={NOTE_STATUSES} defaultValue={values.status} error={errorOf('status')} />

      <div className="btn-row">
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Sedang menyimpan…' : note ? 'Simpan perubahan' : 'Simpan catatan'}
        </button>
        {note && (
          <button type="button" className="btn" onClick={onDone} disabled={isPending}>
            Batal
          </button>
        )}
      </div>
    </form>
  )
}
