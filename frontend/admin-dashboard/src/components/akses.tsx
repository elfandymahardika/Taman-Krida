'use client'

import type { ReactNode } from 'react'
import { Download } from 'lucide-react'
import { useDownloadReport } from './overlay'
import { useAccess } from '../lib/access'
import type { Module } from '../lib/access'

/** Tampilkan isi hanya bila peran boleh MENGUBAH modul ini (mis. tombol "Tambah …" di header). */
export function BolehUbah({ module, children }: { module: Module; children: ReactNode }) {
  return useAccess().canEdit(module) ? children : null
}

/** Tombol "Unduh laporan" (CSV transaksi) — hanya untuk peran yang boleh melihat modul Transaksi. */
export function TombolUnduhLaporan() {
  const download = useDownloadReport()
  if (!useAccess().canView('payments')) return null
  return (
    <button className="btn" onClick={download}>
      <Download strokeWidth={1.75} /> Unduh laporan
    </button>
  )
}
