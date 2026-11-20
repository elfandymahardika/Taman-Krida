import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/session', () => ({ setSession: vi.fn() }))

import { clearCache, useQuery, withQuery } from '@/lib/api'
import { POST } from '@/app/api/vitals/route'

afterEach(() => {
  vi.unstubAllGlobals()
  clearCache()
})

describe('paginasi server — lib/api.ts', () => {
  test('withQuery menyusun ?page=&limit= dan melewati filter kosong', () => {
    expect(withQuery('/orders', { page: 2, limit: 10, q: '', type: false, payment: 'Perlu verifikasi', method: undefined })).toBe(
      '/orders?page=2&limit=10&payment=Perlu+verifikasi',
    )
    expect(withQuery('/orders', {})).toBe('/orders')
  })

  test('keepPrevious: baris halaman lama tetap tampil sampai halaman baru tiba (tabel tidak berkedip/CLS)', async () => {
    let resolvePage2: (r: Response) => void = () => {}
    const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        url.includes('page=1') ? Promise.resolve(json({ data: ['baris halaman 1'] })) : new Promise<Response>((r) => (resolvePage2 = r)),
      ),
    )

    function Tabel({ page }: { page: number }) {
      const q = useQuery<{ data: string[] }>(`/orders?page=${page}`, { keepPrevious: true })
      return <p data-stale={String(q.stale)}>{q.data ? q.data.data.join(',') : 'kosong'}</p>
    }

    const { rerender } = render(<Tabel page={1} />)
    expect(await screen.findByText('baris halaman 1')).toBeTruthy()

    rerender(<Tabel page={2} />)
    // Halaman 2 belum tiba: yang tampil masih baris halaman 1 (ditandai stale), bukan "kosong".
    expect(screen.getByText('baris halaman 1').dataset.stale).toBe('true')

    await act(async () => resolvePage2(json({ data: ['baris halaman 2'] })))
    expect((await screen.findByText('baris halaman 2')).dataset.stale).toBe('false')
  })
})

describe('Core Web Vitals — app/api/vitals/route.ts', () => {
  const send = (body: unknown) => POST(new Request('http://localhost/api/vitals', { method: 'POST', body: JSON.stringify(body) }))
  const metric = { name: 'LCP', value: 1834.2, rating: 'good', id: 'v5-1', navigationType: 'navigate', path: '/transaksi?q=rahasia' }

  test('metrik valid dicatat sebagai satu baris JSON tanpa query string', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    expect((await send(metric)).status).toBe(204)
    const line = JSON.parse(info.mock.calls[0][0])
    expect(line).toMatchObject({ msg: 'web-vitals', metric: 'LCP', value: 1834, rating: 'good', path: '/transaksi' })
  })

  test('nilai "poor" dicatat sebagai warn', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await send({ ...metric, name: 'CLS', value: 0.31, rating: 'poor' })
    expect(JSON.parse(warn.mock.calls[0][0])).toMatchObject({ level: 'warn', metric: 'CLS', value: 0.31 })
  })

  test('menolak metrik tak dikenal, JSON rusak, dan body terlalu besar', async () => {
    expect((await send({ ...metric, name: 'XSS' })).status).toBe(400)
    expect((await POST(new Request('http://localhost/api/vitals', { method: 'POST', body: '{rusak' }))).status).toBe(400)
    expect((await send({ ...metric, id: 'x'.repeat(5000) })).status).toBe(413)
  })
})
