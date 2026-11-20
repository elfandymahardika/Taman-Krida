'use client' // Error boundary wajib Client Component.

import TerjadiKesalahan from '../components/layout/terjadikesalahan'
import '../index.css'

/**
 * Error di root layout (app/layout.tsx). File ini MENGGANTIKAN root layout saat aktif,
 * jadi wajib menyediakan <html> dan <body> sendiri serta memuat CSS global sendiri.
 * `metadata` tidak didukung di sini, judul tab memakai <title>.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="id">
      <body>
        <title>Terjadi kesalahan · Panel Administrator TKBJ</title>
        <TerjadiKesalahan error={error} retry={retry} standalone />
      </body>
    </html>
  )
}
