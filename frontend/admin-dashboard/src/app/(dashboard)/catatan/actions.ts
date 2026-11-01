'use server'

import { revalidatePath } from 'next/cache'
import { BackendError } from '@/lib/backend'
import { archiveNote, createNote, deleteNote, getCurrentUser, updateNote } from '@/lib/dal'
import { NoteSchema, backendErrors, formValues, zodErrors } from '@/lib/schemas'
import type { ActionState } from '@/lib/schemas'

/*
 * Server Action catatan staf. Setiap action adalah endpoint POST publik, jadi urutannya selalu:
 * (1) cek login lewat DAL → (2) cek role bila perlu → (3) validasi Zod → (4) mutasi → revalidatePath.
 * userId pemilik tidak pernah dibaca dari form; backend mengambilnya dari sesi dan memagari query ke pemilik.
 */

const FIELDS = ['title', 'content', 'status'] as const
const LIST_PATH = '/catatan'

/** Error backend → state form. Error lain (mis. redirect ke /login dari DAL) diteruskan apa adanya. */
function failure(error: unknown, values?: Record<string, string>): ActionState {
  if (!(error instanceof BackendError)) throw error
  const message = error.status === 404 ? 'Catatan tidak ditemukan atau bukan milik Anda.' : error.message
  return { success: false, message, errors: backendErrors(error.fields), values }
}

export async function createNoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  // 1. Cek login (otomatis redirect ke /login bila sesi tidak sah)
  await getCurrentUser()
  // 2. Cek role: semua staf aktif boleh membuat catatannya sendiri.

  // 3. Validasi input (jangan throw; kembalikan error per kolom)
  const values = formValues(formData, FIELDS)
  const validation = NoteSchema.safeParse(values)
  if (!validation.success) {
    return { success: false, message: 'Validasi gagal. Periksa kembali isian catatan.', errors: zodErrors(validation.error), values }
  }

  // 4. Mutasi: pemilik = user dari sesi
  try {
    await createNote(validation.data)
  } catch (error) {
    return failure(error, values)
  }

  revalidatePath(LIST_PATH)
  return { success: true, message: 'Catatan berhasil disimpan.' }
}

/** Dipasang lewat updateNoteAction.bind(null, id). ID dari klien tidak dipercaya: backend memeriksa kepemilikannya. */
export async function updateNoteAction(id: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await getCurrentUser()
  const values = formValues(formData, FIELDS)
  const validation = NoteSchema.safeParse(values)
  if (!validation.success) {
    return { success: false, message: 'Validasi gagal. Periksa kembali isian catatan.', errors: zodErrors(validation.error), values }
  }
  try {
    await updateNote(id, validation.data)
  } catch (error) {
    return failure(error, values)
  }
  revalidatePath(LIST_PATH)
  return { success: true, message: 'Perubahan catatan disimpan.' }
}

export async function deleteNoteAction(id: number): Promise<ActionState> {
  await getCurrentUser()
  try {
    await deleteNote(id)
  } catch (error) {
    return failure(error)
  }
  revalidatePath(LIST_PATH)
  return { success: true, message: 'Catatan dihapus.' }
}

/** Aksi khusus admin: arsipkan catatan staf mana pun. Role dicek di sini (dan sekali lagi di backend). */
export async function archiveNoteAdminAction(id: number): Promise<ActionState> {
  const user = await getCurrentUser()
  if (user.roleKey !== 'admin') {
    return { success: false, error: 'FORBIDDEN', message: 'Akses ditolak: hanya Administrator utama yang dapat mengarsipkan catatan staf.' }
  }
  try {
    await archiveNote(id)
  } catch (error) {
    return failure(error)
  }
  revalidatePath(LIST_PATH)
  return { success: true, message: 'Catatan diarsipkan.' }
}
