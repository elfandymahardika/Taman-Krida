import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { OverlayProvider, useOverlay } from '@/components/overlay'
import { ApiError } from '@/lib/api'

afterEach(cleanup)

/** Tombol yang membuka modal konfirmasi; aksinya gagal seperti mutate() saat backend error. */
function TombolVerifikasi({ error }: { error: Error }) {
  const overlay = useOverlay()
  return (
    <button
      type="button"
      onClick={() =>
        overlay.showDetail({
          title: 'Verifikasi pembayaran',
          rows: [['Pesanan', 'TK-1026-0127']],
          primaryLabel: 'Verifikasi lunas',
          onPrimary: () => Promise.reject(error),
        })
      }
    >
      Buka
    </button>
  )
}

describe('error di event handler (tidak ditangkap error boundary)', () => {
  test('aksi gagal → toast error dengan pesan aman, modal tetap terbuka untuk dicoba lagi', async () => {
    render(
      <OverlayProvider>
        <TombolVerifikasi error={new ApiError('Terjadi kesalahan pada server. (kode: 3f2a9c1e)', 500)} />
      </OverlayProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Buka' }))
    fireEvent.click(screen.getByRole('button', { name: 'Verifikasi lunas' }))

    expect(await screen.findByText('Terjadi kesalahan pada server. (kode: 3f2a9c1e)')).toBeTruthy()
    expect(document.querySelector('.toast--error')).toBeTruthy()
    expect(screen.getByText('Verifikasi pembayaran')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Verifikasi lunas' }) as HTMLButtonElement).disabled).toBe(false)
  })
})
