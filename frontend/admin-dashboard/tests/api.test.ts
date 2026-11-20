import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/session', () => ({ setSession: vi.fn() }))

import { ApiError, api } from '@/lib/api'
import { setSession } from '@/lib/session'

const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

afterEach(() => {
  vi.unstubAllGlobals()
})

/** Jalankan api() dan kembalikan error yang dilempar. */
async function failure(response: Response | Error) {
  vi.stubGlobal('fetch', response instanceof Error ? vi.fn().mockRejectedValue(response) : vi.fn().mockResolvedValue(response))
  const error = await api('/events').catch((e) => e)
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}

describe('lib/api.ts — respons saat API gagal', () => {
  test('500: pesan umum dari backend + kode rujukan dari requestId, tanpa detail internal', async () => {
    const error = await failure(jsonResponse(500, { error: 'Terjadi kesalahan pada server.', requestId: '3f2a9c1e-77aa-4c1b-9d2e-0b5c8e1f2a3b' }))
    expect(error.status).toBe(500)
    expect(error.message).toBe('Terjadi kesalahan pada server. (kode: 3f2a9c1e)')
    expect(error.requestId).toBe('3f2a9c1e-77aa-4c1b-9d2e-0b5c8e1f2a3b')
  })

  test('400: pesan & error per kolom diteruskan ke form, tanpa kode rujukan', async () => {
    const error = await failure(jsonResponse(400, { error: 'Periksa kembali isian formulir.', fields: { title: 'Judul wajib diisi.' }, requestId: 'abc' }))
    expect(error.status).toBe(400)
    expect(error.message).toBe('Periksa kembali isian formulir.')
    expect(error.fields).toEqual({ title: 'Judul wajib diisi.' })
  })

  test('respons bukan JSON (mis. halaman HTML proxy) → pesan umum dengan status', async () => {
    const error = await failure(new Response('<html>Bad Gateway</html>', { status: 502 }))
    expect(error.status).toBe(502)
    expect(error.message).toBe('Permintaan gagal (502).')
  })

  test('jaringan putus → status 0 dengan pesan koneksi', async () => {
    const error = await failure(new TypeError('Failed to fetch'))
    expect(error.status).toBe(0)
    expect(error.message).toMatch(/Tidak dapat terhubung/)
  })

  test('401 → sesi dikosongkan sehingga pengguna diarahkan ke /login', async () => {
    const error = await failure(jsonResponse(401, { error: 'Sesi berakhir.' }))
    expect(error.status).toBe(401)
    expect(setSession).toHaveBeenCalledWith(null)
  })
})
