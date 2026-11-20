import { useEffect, useState, useSyncExternalStore } from 'react'
import { setSession } from './session'

/*
 * Klien REST API backend (`backend/admin-dashboard`) untuk Client Component.
 * Permintaan dikirim ke proxy same-origin /api/be (app/api/be/[...path]/route.ts) yang menambahkan
 * token dari cookie HttpOnly, sehingga JavaScript di browser tidak pernah memegang token.
 * - `api()`      : satu permintaan, melempar ApiError bila gagal.
 * - `useQuery()` : data GET dengan cache bersama, revalidasi, dan refresh berkala.
 * - `mutate()`   : permintaan yang mengubah data, lalu memuat ulang semua query aktif
 *                  sehingga metrik, tabel, dan log aktivitas langsung ikut berubah.
 */

/** Proxy API same-origin. Alamat backend sebenarnya (API_URL) hanya dipakai di server, lihat lib/backend.ts. */
export const API_URL = '/api/be'

export type FieldErrors = Record<string, string | undefined>

export class ApiError extends Error {
  status: number
  fields?: FieldErrors
  /** ID permintaan dari backend (X-Request-Id), sama dengan baris log backend. */
  requestId?: string

  constructor(message: string, status: number, fields?: FieldErrors, requestId?: string) {
    super(message)
    this.status = status
    this.fields = fields
    this.requestId = requestId
  }
}

/**
 * Error dari respons gagal. Pesan dari backend sudah aman ditampilkan (error 500 hanya berisi pesan umum);
 * error server (5xx) diberi kode rujukan pendek dari requestId agar admin bisa mencarinya di log backend.
 */
export function responseError(status: number, data: any, requestId?: string | null, fallback = `Permintaan gagal (${status}).`) {
  const id = data?.requestId ?? requestId ?? undefined
  const message = data?.error ?? fallback
  return new ApiError(status >= 500 && id ? `${message} (kode: ${String(id).slice(0, 8)})` : message, status, data?.fields, id)
}

export type RequestOptions = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown }

async function request(path: string, { method = 'GET', body }: RequestOptions = {}) {
  let res: Response
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server panel. Periksa koneksi Anda.', 0)
  }
  if (res.status === 401) {
    // Sesi kedaluwarsa / dicabut → kosongkan sesi; SessionProvider mengalihkan ke /login.
    clearCache()
    setSession(null)
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw responseError(res.status, data, res.headers.get('x-request-id'))
  }
  return res
}

export async function api<T = any>(path: string, options?: RequestOptions): Promise<T> {
  const res = await request(path, options)
  return res.status === 204 ? null : res.json()
}

/** Unduh berkas dari API (mis. CSV) memakai sesi login. */
export async function download(path: string) {
  const res = await request(path)
  const name = /filename="?([^";]+)"?/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? 'unduhan'
  const url = URL.createObjectURL(await res.blob())
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return name
}

/**
 * Buka berkas privat dari API (mis. bukti transfer, KTP pemohon) di tab baru memakai sesi login.
 * Tab dibuka lebih dulu (saat diklik) agar tidak diblokir browser, lalu diisi setelah berkas diterima;
 * bila gagal, tab ditutup dan ApiError dilempar (pesan dari server, mis. "Berkas tidak ditemukan").
 */
export async function openFile(path: string) {
  const tab = window.open('', '_blank')
  try {
    const res = await request(path)
    const url = URL.createObjectURL(await res.blob())
    if (tab) tab.location.href = url
    else window.location.assign(url)
    // Beri waktu tab memuat berkas sebelum URL sementara dilepas.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    tab?.close()
    throw err
  }
}

/** Simpan tabel sebagai berkas CSV di browser (BOM agar Excel membaca UTF-8). */
export function saveCsv(name: string, rows: (string | number)[][]) {
  const cell = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`
  const csv = `﻿${rows.map((r) => r.map(cell).join(',')).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return name
}

/** URL berkas yang disajikan backend. Berkas lokal ("/uploads/x.jpg") dilayani lewat domain frontend yang sama. */
export const assetUrl = (path: string) => path

/**
 * Unggah berkas dengan progres: body = File (berkas mentah) atau FormData (multipart, mis. field "file").
 * Memakai XHR karena fetch belum melaporkan progres unggahan. Mengembalikan { promise, abort }.
 */
export function upload<T = any>(path: string, body: File | FormData, { onProgress }: { onProgress?: (percent: number) => void } = {}) {
  const xhr = new XMLHttpRequest()
  const promise = new Promise<T>((resolve, reject) => {
    xhr.open('POST', API_URL + path)
    // FormData: browser mengisi Content-Type multipart beserta boundary-nya sendiri.
    if (body instanceof File) xhr.setRequestHeader('Content-Type', body.type || 'application/octet-stream')
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => {
      let data = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        // Respons bukan JSON.
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        invalidate()
        resolve(data)
      } else {
        if (xhr.status === 401) setSession(null)
        reject(responseError(xhr.status, data, xhr.getResponseHeader('x-request-id'), `Unggahan gagal (${xhr.status}).`))
      }
    }
    xhr.onerror = () => reject(new ApiError('Tidak dapat terhubung ke server panel.', 0))
    xhr.onabort = () => reject(new ApiError('Unggahan dibatalkan.', 0))
    xhr.send(body)
  })
  return { promise, abort: () => xhr.abort() }
}

/* ---------- Cache query ---------- */

type Entry = { data?: unknown; error?: ApiError | null; at?: number; promise?: Promise<unknown> | null }

const cache = new Map<string, Entry>()
const active = new Map<string, number>() // key → jumlah komponen yang memakai
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l))

function load(key: string) {
  const entry = cache.get(key)
  if (entry?.promise) return entry.promise
  const promise = api(key).then(
    (data) => cache.set(key, { data, error: null, at: Date.now() }),
    (error) => cache.set(key, { ...cache.get(key), error, promise: null }),
  )
  cache.set(key, { ...entry, promise })
  promise.finally(emit)
  emit()
  return promise
}

/** Muat ulang query yang sedang tampil; query lain ditandai basi. */
export function invalidate() {
  for (const key of cache.keys()) {
    if (active.get(key)) load(key)
    else cache.set(key, { ...cache.get(key), at: 0 })
  }
}

export function clearCache() {
  cache.clear()
  emit()
}

const STALE_MS = 5000

/**
 * Ambil data GET. `key` = path API (null untuk menunda).
 * `refreshInterval` (ms) memuat ulang berkala selama tab terlihat.
 * `keepPrevious`: saat `key` berganti (mis. pindah halaman tabel/ganti filter), tetap tampilkan data lama sampai data
 * baru tiba. Tabel tidak sempat kosong lalu terisi lagi, sehingga tata letak tidak "melompat" (CLS).
 */
export function useQuery<T = any>(
  key: string | null | undefined,
  { refreshInterval, keepPrevious }: { refreshInterval?: number; keepPrevious?: boolean } = {},
) {
  const current = useSyncExternalStore(
    subscribe,
    () => (key ? cache.get(key) : undefined),
    () => undefined,
  )
  // Simpan entri terakhir yang berisi data (pola "menyimpan nilai dari render sebelumnya" di dokumentasi React).
  const [last, setLast] = useState<Entry | undefined>(undefined)
  if (keepPrevious && current?.data !== undefined && current !== last) setLast(current)
  const placeholder = keepPrevious && current?.data === undefined && !current?.error ? last : undefined
  const entry = placeholder ? { ...placeholder, promise: current?.promise } : current

  useEffect(() => {
    if (!key) return
    active.set(key, (active.get(key) ?? 0) + 1)
    const current = cache.get(key)
    if (!current?.promise && Date.now() - (current?.at ?? 0) > STALE_MS) load(key)
    const timer =
      refreshInterval &&
      setInterval(() => document.visibilityState === 'visible' && load(key), refreshInterval)
    return () => {
      active.set(key, active.get(key) - 1)
      if (timer) clearInterval(timer)
    }
  }, [key, refreshInterval])

  return {
    data: entry?.data as T | undefined,
    error: entry?.data === undefined ? entry?.error : null,
    /** Belum ada data sama sekali. */
    loading: entry?.data === undefined && !entry?.error,
    /** Sedang memuat (termasuk refresh di latar belakang). */
    refreshing: Boolean(entry?.promise),
    /** Data yang tampil masih milik `key` sebelumnya (hanya dengan `keepPrevious`). */
    stale: Boolean(placeholder),
    updatedAt: entry?.at,
    reload: () => key && load(key),
  }
}

/** POST/PUT/PATCH/DELETE lalu segarkan semua data yang tampil. */
export async function mutate<T = any>(path: string, options?: RequestOptions) {
  const data = await api<T>(path, options)
  invalidate()
  return data
}

/* ---------- Paginasi server ---------- */

/** Respons daftar berhalaman dari backend (`?page=1&limit=10`), lihat backend lib/pagination.ts. */
export type Paginated<T> = {
  data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

/** Susun path dengan query string; nilai kosong/undefined/false dilewati. */
export function withQuery(path: string, params: Record<string, string | number | undefined | null | false>) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== false && v !== '') qs.set(k, String(v))
  const text = qs.toString()
  return text ? `${path}?${text}` : path
}

/**
 * Nilai yang baru berubah setelah pengguna berhenti mengetik `delay` ms. Dipakai kotak pencarian tabel agar
 * tidak mengirim satu permintaan ke server per huruf (input tetap responsif → INP rendah).
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
