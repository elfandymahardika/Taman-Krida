// @vitest-environment node
import { describe, expect, test, vi } from 'vitest'
import nextConfig from '../next.config.mjs'
import { onRequestError } from '@/instrumentation'

describe('next.config.mjs — header keamanan', () => {
  test('semua halaman: nosniff, DENY, Referrer-Policy, Permissions-Policy', async () => {
    const rules = await nextConfig.headers()
    const all = rules.find((r) => r.source === '/:path*')
    const get = (key: string) => all.headers.find((h) => h.key === key)?.value
    expect(get('X-Content-Type-Options')).toBe('nosniff')
    expect(get('X-Frame-Options')).toBe('DENY')
    expect(get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(get('Permissions-Policy')).toMatch(/camera=\(\)/)
  })

  test('/uploads boleh di-iframe oleh origin sendiri (pratinjau PDF), dan aturannya ditaruh terakhir agar menimpa DENY', async () => {
    const rules = await nextConfig.headers()
    const last = rules.at(-1)
    expect(last.source).toBe('/uploads/:path*')
    expect(last.headers).toEqual([{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }])
  })
})

describe('instrumentation.ts — onRequestError', () => {
  test('mencatat error server dengan digest & rute, tanpa cookie, Authorization, atau query string', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = Object.assign(new Error('Backend tidak terjangkau'), { digest: '2817439056' })
    await onRequestError(
      error,
      { path: '/tiket?q=budi.santoso@email.com', method: 'GET', headers: { cookie: 'tkbj_session=token-rahasia', authorization: 'Bearer token-rahasia' } },
      {
        routerKind: 'App Router',
        routePath: '/(dashboard)/tiket',
        routeType: 'render',
        renderSource: 'server-rendering',
        revalidateReason: undefined,
      },
    )
    expect(log).toHaveBeenCalledOnce()
    const line = String(log.mock.calls[0][0])
    const entry = JSON.parse(line)
    expect(entry).toMatchObject({
      digest: '2817439056',
      error: { message: 'Backend tidak terjangkau' },
      request: { method: 'GET', path: '/tiket' },
      route: { path: '/(dashboard)/tiket', type: 'render' },
    })
    expect(line).not.toMatch(/token-rahasia|tkbj_session|budi\.santoso/)
  })
})
