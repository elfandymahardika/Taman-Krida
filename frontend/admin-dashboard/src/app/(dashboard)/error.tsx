'use client' // Error boundary wajib Client Component.

import TerjadiKesalahan from '../../components/layout/terjadikesalahan'

/**
 * Error boundary halaman panel: membungkus page.tsx di bawah (dashboard), jadi sidebar & topbar dari
 * layout.tsx tetap tampil dan pengguna bisa pindah menu atau mencoba lagi.
 */
export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  return <TerjadiKesalahan error={error} retry={retry} />
}
