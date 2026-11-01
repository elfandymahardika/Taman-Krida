import { z } from 'zod'

/*
 * Schema validasi bersama (Zod). Dipakai Server Action sebelum data dikirim ke backend;
 * aturannya sama dengan middleware validator.ts di backend, yang tetap memvalidasi ulang.
 * Nilai dari FormData selalu berupa string, jadi angka perlu z.coerce.number().
 */

// Schema auth (login & daftar) ada di lib/validation/auth.ts.

export const NOTE_STATUSES = ['Draf', 'Terpublikasi', 'Diarsipkan'] as const

/** Catatan staf. Pemilik (userId) sengaja TIDAK ada di schema: selalu diambil dari sesi di server. */
export const NoteSchema = z.object({
  title: z.string().trim().min(3, 'Judul minimal 3 karakter.').max(100, 'Judul maksimal 100 karakter.'),
  content: z
    .string()
    .trim()
    .max(500, 'Isi catatan maksimal 500 karakter.')
    .transform((v) => v || null),
  status: z.enum(NOTE_STATUSES, { error: 'Status catatan tidak dikenal.' }).default('Draf'),
})

export type NoteInput = z.infer<typeof NoteSchema>

/** State kembalian Server Action untuk useActionState. `values` = isian terakhir agar form tidak kosong saat gagal. */
export type ActionState = {
  success?: boolean
  message?: string
  error?: 'FORBIDDEN'
  errors?: Record<string, string[] | undefined>
  values?: Record<string, string>
}

/** Ambil kolom teks dari FormData (kolom yang tidak dikirim = string kosong). */
export const formValues = (formData: FormData, keys: readonly string[]) =>
  Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? '')]))

/** Error Zod → { kolom: [pesan, ...] } */
export const zodErrors = (error: z.ZodError) => z.flattenError(error).fieldErrors as Record<string, string[]>

/** Error per kolom dari backend ({ kolom: pesan }) → format yang sama dengan Zod. */
export const backendErrors = (fields?: Record<string, string>) =>
  fields ? Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, [v]])) : undefined
