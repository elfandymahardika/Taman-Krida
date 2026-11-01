import 'server-only'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE } from './cookie'

/*
 * Penghubung server Next.js ↔ backend Express (hanya berjalan di server).
 * Browser tidak pernah memegang token: semua permintaan lewat Server Action, DAL, atau proxy /api/be
 * yang menambahkan header Authorization dari cookie HttpOnly.
 */

/** Alamat API backend dari .env.local (bisa URL Ngrok rekan tim), bawaan: backend lokal port 5000. */
export const BACKEND_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '')
export const BACKEND_ORIGIN = BACKEND_API_URL.replace(/\/api$/, '')

/** Ngrok Free menampilkan halaman peringatan HTML untuk permintaan tanpa header ini; backend lokal mengabaikannya. */
const NGROK_HEADER = { 'ngrok-skip-browser-warning': 'true' }

const UNREACHABLE = `Tidak dapat terhubung ke server API (${BACKEND_API_URL}). Pastikan backend sudah berjalan.`

export type BackendFields = Record<string, string>

export class BackendError extends Error {
  status: number
  fields?: BackendFields

  constructor(message: string, status: number, fields?: BackendFields) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

type FetchOptions = { token?: string; method?: string; body?: unknown; headers?: Record<string, string> }

/** Panggil API backend dari server; melempar BackendError dengan pesan & error per kolom dari backend. */
export async function backendFetch<T = any>(path: string, { token, method = 'GET', body, headers }: FetchOptions = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(BACKEND_API_URL + path, {
      method,
      cache: 'no-store',
      headers: {
        ...NGROK_HEADER,
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new BackendError(UNREACHABLE, 0)
  }
  if (res.status === 204) return null as T
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new BackendError(data?.error ?? `Permintaan gagal (${res.status}).`, res.status, data?.fields)
  return data
}

const REQUEST_HEADERS = ['content-type', 'accept', 'user-agent']
const RESPONSE_HEADERS = ['content-type', 'content-disposition', 'cache-control', 'last-modified', 'etag', 'x-content-type-options']

/**
 * Teruskan permintaan browser ke backend apa adanya (body di-stream, termasuk unggahan berkas),
 * dengan token dari cookie HttpOnly sebagai `Authorization: Bearer`.
 */
export async function forwardToBackend(req: NextRequest, target: string, { withAuth = true } = {}) {
  const headers = new Headers(NGROK_HEADER)
  for (const name of REQUEST_HEADERS) {
    const value = req.headers.get(name)
    if (value) headers.set(name, value)
  }
  const token = withAuth ? req.cookies.get(SESSION_COOKIE)?.value : undefined
  if (token) headers.set('authorization', `Bearer ${token}`)

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  let res: Response
  try {
    res = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      cache: 'no-store',
      redirect: 'manual',
      // Wajib di Node.js bila body berupa stream.
      ...(hasBody && { duplex: 'half' }),
    } as RequestInit)
  } catch {
    return Response.json({ error: UNREACHABLE }, { status: 502 })
  }

  const out = new Headers()
  for (const name of RESPONSE_HEADERS) {
    const value = res.headers.get(name)
    if (value) out.set(name, value)
  }
  return new Response(res.body, { status: res.status, headers: out })
}
