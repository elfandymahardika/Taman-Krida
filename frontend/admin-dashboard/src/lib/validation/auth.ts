import { z } from 'zod'

/*
 * Aturan validasi form auth yang dipakai ulang (Server Action login & daftar, dan petunjuk di form).
 * Sama dengan backend (lib/validate.ts & lib/validatePassword.ts) — validasi di sini hanya untuk pesan
 * cepat; backend tetap memeriksa ulang karena request bisa dikirim tanpa lewat form web.
 */

export const USERNAME_RE = /^[a-z0-9._]+$/

/** Syarat password, ditampilkan di form daftar. */
export const PASSWORD_HINT = 'Minimal 8 karakter, memuat huruf besar, huruf kecil, dan angka.'

/** Kekuatan password (registrasi): minimal 8 karakter, huruf besar, huruf kecil, angka. */
export const PasswordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter.')
  .regex(/[A-Z]/, 'Password harus memuat huruf besar.')
  .regex(/[a-z]/, 'Password harus memuat huruf kecil.')
  .regex(/\d/, 'Password harus memuat angka.')
  .refine((v) => new TextEncoder().encode(v).length <= 72, 'Password maksimal 72 byte.')

export const EmailSchema = z.string().trim().toLowerCase().pipe(z.email('Format email tidak valid.'))

/** Login tidak memeriksa kekuatan password, agar akun lama tetap bisa masuk. */
export const LoginSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Username wajib diisi.')
    .regex(USERNAME_RE, 'Username hanya boleh huruf, angka, titik, atau garis bawah.'),
  password: z.string().min(1, 'Password wajib diisi.').min(6, 'Password minimal 6 karakter.'),
})

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .transform((v) => v.replace(/\s+/g, ' '))
      .pipe(z.string().min(3, 'Nama lengkap minimal 3 karakter.').max(60, 'Nama lengkap maksimal 60 karakter.')),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'Username wajib diisi.')
      .regex(USERNAME_RE, 'Username hanya boleh huruf kecil, angka, titik, atau garis bawah.')
      .min(3, 'Username 3–30 karakter.')
      .max(30, 'Username 3–30 karakter.'),
    email: EmailSchema,
    password: PasswordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.confirm === d.password, { message: 'Konfirmasi password tidak sama.', path: ['confirm'] })

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
