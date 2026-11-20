// @vitest-environment node
import { afterEach, describe, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { BackendError, backendFetch, forwardToBackend, forwardedFor } from '@/lib/backend'
import { SESSION_COOKIE } from '@/lib/cookie'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('lib/backend.ts — proxy browser → backend', () => {
  test('meneruskan IP pengguna (entri terakhir X-Forwarded-For) dan token dari cookie, bukan cookie-nya', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const req = new NextRequest('http://localhost:3000/api/be/events', {
      headers: { 'x-forwarded-for': '10.0.0.1, 203.0.113.5', cookie: `${SESSION_COOKIE}=token-staf; lain=1` },
    })
    await forwardToBackend(req, 'http://localhost:5000/api/events')
    const sent = new Headers(fetchMock.mock.calls[0][1].headers)
    expect(sent.get('x-forwarded-for')).toBe('203.0.113.5')
    expect(sent.get('authorization')).toBe('Bearer token-staf')
    expect(sent.get('cookie')).toBeNull()
  })

  test('hanya header respons yang aman diteruskan (termasuk X-Request-Id), Set-Cookie backend tidak', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{"error":"Terjadi kesalahan pada server."}', {
          status: 500,
          headers: { 'content-type': 'application/json', 'x-request-id': 'req-123', 'set-cookie': 'x=1', 'x-powered-by': 'Express' },
        }),
      ),
    )
    const res = await forwardToBackend(new NextRequest('http://localhost:3000/api/be/events'), 'http://localhost:5000/api/events')
    expect(res.status).toBe(500)
    expect(res.headers.get('x-request-id')).toBe('req-123')
    expect(res.headers.get('set-cookie')).toBeNull()
    expect(res.headers.get('x-powered-by')).toBeNull()
  })

  test('backend mati → 502 JSON dengan pesan yang bisa dipahami, tanpa stack trace', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:5000')))
    const res = await forwardToBackend(new NextRequest('http://localhost:3000/api/be/events'), 'http://localhost:5000/api/events')
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error).toMatch(/Tidak dapat terhubung ke server API/)
    expect(JSON.stringify(body)).not.toMatch(/ECONNREFUSED|stack|\n\s+at /)
  })

  test('backendFetch: error backend menjadi BackendError berisi status, kolom, dan requestId', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{"error":"Periksa kembali isian formulir.","fields":{"username":"Wajib diisi."}}', {
          status: 400,
          headers: { 'content-type': 'application/json', 'x-request-id': 'req-400' },
        }),
      ),
    )
    const error = await backendFetch('/auth/login', { method: 'POST', body: {} }).catch((e) => e)
    expect(error).toBeInstanceOf(BackendError)
    expect(error).toMatchObject({ status: 400, fields: { username: 'Wajib diisi.' }, requestId: 'req-400' })
  })

  test('forwardedFor: tanpa X-Forwarded-For tidak menambah header', () => {
    expect(forwardedFor(new Headers())).toEqual({})
    expect(forwardedFor(new Headers({ 'x-forwarded-for': '198.51.100.7' }))).toEqual({ 'X-Forwarded-For': '198.51.100.7' })
  })
})
