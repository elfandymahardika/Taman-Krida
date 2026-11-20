import 'server-only'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE } from './cookie'

/*
 * Penghubung server Next.js ↔ backend Express (hanya berjalan di server).
 * Browser tidak pernah memegang token: semua permintaan lewat Server Action, DAL, atau proxy /api/be
 * yang menambahkan header Authorization dari cookie HttpOnly.
 */

/**
 * Alamat API backend, bawaan: backend lokal port 5000.
 * `API_URL` dibaca saat RUNTIME (saat server jalan), sehingga satu image Docker yang sama bisa dipakai di development,
 * staging, dan production hanya dengan mengganti environment. `NEXT_PUBLIC_*` sebaliknya DIKUNCI saat `next build`,
 * jadi hanya dipakai sebagai cadangan untuk .env.local lama (development).
 */
export const BACKEND_API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
export const BACKEND_ORIGIN = BACKEND_API_URL.replace(/\/api$/, '')

/** Ngrok Free menampilkan halaman peringatan HTML untuk permintaan tanpa header ini; backend lokal mengabaikannya. */
const NGROK_HEADER = { 'ngrok-skip-browser-warning': 'true' }

const UNREACHABLE = `Tidak dapat terhubung ke server API (${BACKEND_API_URL}). Pastikan backend sudah berjalan.`

export type BackendFields = Record<string, string>

export class BackendError extends Error {
  status: number
  fields?: BackendFields
  /** ID permintaan dari backend (header X-Request-Id), untuk dicari di log backend. */
  requestId?: string

  constructor(message: string, status: number, fields?: BackendFields, requestId?: string) {
    super(message)
    this.status = status
    this.fields = fields
    this.requestId = requestId
  }
}

/**
 * IP pengguna untuk pembatas percobaan (rate limit) di backend: entri TERAKHIR X-Forwarded-For, yaitu yang
 * ditambahkan proxy terdekat (Ngrok) atau diisi Next.js dari koneksi bila tanpa proxy. Tanpa ini backend melihat
 * semua staf dari satu IP (server Next.js) sehingga satu orang yang salah password berulang kali ikut memblokir
 * login staf lain. Backend hanya memercayai header ini dari localhost (TRUST_PROXY=loopback).
 */
export function forwardedFor(headers: Pick<Headers, 'get'>): Record<string, string> {
  const ip = headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
  return ip ? { 'X-Forwarded-For': ip } : {}
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
  if (!res.ok) {
    const requestId = res.headers.get('x-request-id') ?? undefined
    throw new BackendError(data?.error ?? `Permintaan gagal (${res.status}).`, res.status, data?.fields, requestId)
  }
  return data
}

const REQUEST_HEADERS = ['content-type', 'accept', 'user-agent']
const RESPONSE_HEADERS = [
  'content-type',
  'content-disposition',
  'cache-control',
  'last-modified',
  'etag',
  'x-content-type-options',
  'x-request-id',
  'retry-after',
]

/**
 * Teruskan permintaan browser ke backend apa adanya (body di-stream, termasuk unggahan berkas),
 * dengan token dari cookie HttpOnly sebagai `Authorization: Bearer`.
 */
export async function forwardToBackend(req: NextRequest, target: string, { withAuth = true } = {}) {
  const headers = new Headers({ ...NGROK_HEADER, ...forwardedFor(req.headers) })
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
