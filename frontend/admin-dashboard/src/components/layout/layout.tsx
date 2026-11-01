'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Note } from '../ui'
import { MODULE_LABEL, moduleOf, useAccess } from '../../lib/access'
import { useSession } from '../../data/auth'
import { ALL_ITEMS } from './menu'
import Sidebar from './sidebar'
import Topbar from './topbar'
import AksesDitolak from './aksesditolak'

/**
 * Kerangka halaman admin: sidebar + topbar + isi halaman.
 * Guard otorisasi (RBAC) di level UI: halaman modul tanpa akses diganti halaman 403,
 * halaman modul "hanya lihat" diberi penanda. Backend tetap menolak permintaan yang sama dengan 403.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { level } = useAccess()
  const role = useSession()?.user.role
  // Drawer navigasi (layar kecil) otomatis tertutup saat rute berubah.
  const [navOpenAt, setNavOpenAt] = useState<string | null>(null)
  const navOpen = navOpenAt === pathname
  const current = ALL_ITEMS.find((i) => i.to === pathname) ?? ALL_ITEMS[0]
  const pageModule = moduleOf(pathname)
  const access = level(pageModule)

  return (
    <div className={`app ${navOpen ? 'nav-open' : ''}`}>
      <Sidebar />
      <div className="sidebar-backdrop" onClick={() => setNavOpenAt(null)} />
      <div className="workspace">
        <Topbar title={current.label} onMenu={() => setNavOpenAt(pathname)} />
        <main className="page">
          {access === 'n' ? (
            <AksesDitolak module={pageModule} role={role} />
          ) : (
            <>
              {access === 'p' && (
                <Note tone="info">
                  Mode lihat saja — peran {role} hanya dapat melihat modul {MODULE_LABEL[pageModule]}. Perubahan data akan ditolak server.
                </Note>
              )}
              {children}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
