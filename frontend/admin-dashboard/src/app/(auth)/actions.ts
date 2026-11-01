'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { BackendError, backendFetch } from '@/lib/backend'
import { SESSION_COOKIE } from '@/lib/cookie'
import { backendErrors, formValues, zodErrors } from '@/lib/schemas'
import { LoginSchema, RegisterSchema } from '@/lib/validation/auth'
import type { AuthResponse, RegisterResponse } from '@/lib/types'
import type { ActionState } from '@/lib/schemas'

/*
 * Server Action autentikasi. Backend Express tetap yang memeriksa password (bcrypt) dan menerbitkan JWT
 * (Modul 01); di sini token itu disimpan sebagai cookie HttpOnly agar tidak bisa dicuri lewat JavaScript.
 */

/** Hanya path internal yang boleh jadi tujuan setelah login (mencegah open redirect). */
const safeFrom = (from: string) => (from.startsWith('/') && !from.startsWith('//') ? from : '/')

/** Secure di HTTPS (produksi, Ngrok) dan di localhost (browser memperlakukannya sebagai konteks aman). */
async function isSecureRequest() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  return h.get('x-forwarded-proto') === 'https' || /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, ['username', 'password', 'from'])
  const parsed = LoginSchema.safeParse(values)
  if (!parsed.success) return { success: false, errors: zodErrors(parsed.error), values }

  let result: AuthResponse
  try {
    result = await backendFetch('/auth/login', {
      method: 'POST',
      body: parsed.data,
      headers: { 'User-Agent': (await headers()).get('user-agent') ?? 'Next.js' },
    })
  } catch (error) {
    const e = error as BackendError
    return {
      success: false,
      message: e.status === 401 ? 'Username atau password salah. Gunakan akun demo di bawah.' : e.message,
      errors: backendErrors(e.fields),
      values,
    }
  }

  ;(await cookies()).set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: await isSecureRequest(),
    path: '/',
    // Sama dengan masa berlaku token ("60m" → 3600 detik).
    maxAge: (parseInt(result.expiresIn, 10) || 60) * 60,
  })
  redirect(safeFrom(values.from))
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, ['name', 'username', 'email', 'password', 'confirm'])
  const parsed = RegisterSchema.safeParse(values)
  if (!parsed.success) return { success: false, errors: zodErrors(parsed.error), values }

  try {
    const res = await backendFetch<RegisterResponse>('/auth/register', { method: 'POST', body: parsed.data })
    return { success: true, message: res.message, values: { username: res.user.username } }
  } catch (error) {
    const e = error as BackendError
    return { success: false, message: e.fields ? undefined : e.message, errors: backendErrors(e.fields), values }
  }
}

/** Cabut sesi di backend (abaikan bila backend tidak terjangkau), hapus cookie, kembali ke /login. */
export async function logoutAction() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) await backendFetch('/auth/logout', { method: 'POST', token }).catch(() => {})
  store.delete(SESSION_COOKIE)
  redirect('/login')
}
