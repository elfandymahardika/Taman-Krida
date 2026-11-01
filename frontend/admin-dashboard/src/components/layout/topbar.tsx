'use client'

import { ChevronDown, ChevronRight, Menu } from 'lucide-react'
import { useOverlay } from '../overlay'
import { useSession } from '../../data/auth'
import { logout } from '../../lib/user-auth'
import { LEVEL_LABEL, MODULE_LABEL } from '../../lib/access'
import type { Module } from '../../lib/access'
import type { SessionUser } from '../../lib/session'
import Pencarian from './pencarian'
import Notifikasi from './notifikasi'

/** Topbar: tombol menu (layar kecil), breadcrumb, pencarian, notifikasi, dan menu akun. */
export default function Topbar({ title, onMenu }: { title: string; onMenu: () => void }) {
  const { showDetail } = useOverlay()
  // Sesi bisa kosong sesaat ketika logout sebelum dialihkan ke /login.
  const { user = {} as SessionUser, loginAt = '' } = useSession() ?? {}

  const openAccount = () =>
    showDetail({
      title: 'Akun Administrator',
      subtitle: 'Masuk sebagai Administrator TKBJ. Kelola akun atau keluar dari panel.',
      rows: [
        ['Nama', user.name],
        ['Peran', user.role],
        ['Username', user.username],
        ['Masuk sejak', new Date(loginAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })],
        [
          'Hak akses',
          Object.entries(user.access ?? {})
            .map(([m, l]) => `${MODULE_LABEL[m as Module]}: ${LEVEL_LABEL[l]}`)
            .join(' · '),
        ],
      ],
      cancelLabel: 'Tutup',
      primaryLabel: 'Keluar',
      success: 'Anda telah keluar dari panel',
      // Logout (Server Action): sesi dicabut di backend, cookie HttpOnly dihapus, lalu dialihkan ke /login.
      onPrimary: async () => {
        await logout()
      },
    })

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="menu-toggle" aria-label="Buka navigasi" onClick={onMenu}>
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <nav className="breadcrumb" aria-label="Jejak navigasi">
          <span className="breadcrumb__root">Administrator</span>
          <ChevronRight strokeWidth={1.75} />
          <span className="breadcrumb__current">{title}</span>
        </nav>
      </div>
      <div className="topbar__right">
        <Pencarian />
        <span className="badge badge--primary data-flag">Data contoh</span>
        <Notifikasi />
        <div className="topbar__sep" />
        <button className="account" onClick={openAccount}>
          <span className="avatar">{user.initials}</span>
          <span className="account__id">
            <span className="account__name">{user.name}</span>
            <span className="account__role">{user.role}</span>
          </span>
          <ChevronDown strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}
