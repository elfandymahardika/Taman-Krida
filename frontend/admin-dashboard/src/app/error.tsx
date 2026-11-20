'use client' // Error boundary wajib Client Component.

import TerjadiKesalahan from '../components/layout/terjadikesalahan'

/**
 * Error boundary segmen root: menangkap error di halaman login/daftar dan di layout panel
 * (mis. backend tidak terjangkau saat memeriksa sesi). Error di dalam halaman panel ditangkap
 * lebih dulu oleh app/(dashboard)/error.tsx agar sidebar tetap tampil.
 *
 * Next.js 16.4 menyediakan `retry()` (ambil ulang data server + render ulang) dan `reset()` (render ulang saja);
 * `retry()` dipakai karena penyebab error umumnya data server yang gagal dimuat.
 */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <TerjadiKesalahan error={error} retry={retry} standalone />
}
