import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import ErrorPage from '@/app/error'
import DashboardError from '@/app/(dashboard)/error'
import GlobalError from '@/app/global-error'
import NotFound from '@/app/not-found'

// Error boundary mencatat error ke konsol browser; dibungkam agar keluaran test bersih.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(cleanup)

/** Bentuk error dari Server Component di production: pesan diganti Next.js, tersisa digest. */
const serverError = Object.assign(new Error('ER_ACCESS_DENIED: password=rahasia123 di 10.0.0.5'), { digest: '2817439056' })

describe('app/error.tsx', () => {
  test('menampilkan pesan aman + kode digest, tanpa detail internal error', () => {
    render(<ErrorPage error={serverError} retry={() => {}} />)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Halaman ini gagal dimuat')).toBeTruthy()
    expect(screen.getByText('2817439056')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/rahasia|ER_ACCESS_DENIED|10\.0\.0\.5/)
  })

  test('tombol "Coba lagi" memanggil retry()', () => {
    const retry = vi.fn()
    render(<ErrorPage error={serverError} retry={retry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(retry).toHaveBeenCalledOnce()
  })

  test('error dari browser (tanpa digest) tidak menampilkan kode', () => {
    render(<ErrorPage error={new TypeError('Cannot read properties of undefined')} retry={() => {}} />)
    expect(document.querySelector('code')).toBeNull()
    expect(document.body.textContent).not.toMatch(/Cannot read/)
  })
})

describe('app/(dashboard)/error.tsx', () => {
  test('tampil di dalam layout panel (bukan halaman penuh) dengan tombol coba lagi', () => {
    const retry = vi.fn()
    const { container } = render(<DashboardError error={serverError} retry={retry} />)
    expect(container.querySelector('.status-page')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(retry).toHaveBeenCalledOnce()
  })
})

describe('app/global-error.tsx', () => {
  test('menyediakan <html> dan <body> sendiri karena menggantikan root layout', () => {
    const html = renderToStaticMarkup(<GlobalError error={serverError} retry={() => {}} />)
    expect(html).toMatch(/^<html lang="id">.*<body><main class="status-page">.*<\/body><\/html>$/)
    expect(html).toContain('Coba lagi')
    expect(html).not.toContain('rahasia')
  })
})

describe('app/not-found.tsx', () => {
  test('menampilkan halaman 404 dengan tautan kembali ke Dashboard', () => {
    render(<NotFound />)
    expect(screen.getByText('Halaman tidak ditemukan')).toBeTruthy()
    expect(screen.getByText(/404/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Kembali ke Dashboard' }).getAttribute('href')).toBe('/')
  })
})
