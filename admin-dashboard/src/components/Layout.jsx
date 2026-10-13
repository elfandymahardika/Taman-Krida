'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  Images,
  LayoutDashboard,
  Map,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react'
import { useOverlay } from './overlay'
import { asset } from '../data/sample'
import { auth, useSession } from '../data/auth'

const NAV = [
  { group: null, items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    group: 'Operasional',
    items: [
      { to: '/acara', label: 'Acara & kalender', icon: CalendarDays },
      { to: '/tiket', label: 'Tiket pertunjukan', icon: Ticket },
      { to: '/sewa', label: 'Sewa gedung', icon: Building2 },
      { to: '/transaksi', label: 'Transaksi & pembayaran', icon: CreditCard },
    ],
  },
  {
    group: 'Informasi & komunitas',
    items: [
      { to: '/profil', label: 'Profil & denah', icon: Map },
      { to: '/galeri', label: 'Virtual galeri', icon: Images },
      { to: '/komunitas', label: 'Direktori komunitas', icon: Users },
      { to: '/konten', label: 'Konten', icon: FileText },
    ],
  },
  {
    group: 'Administrasi',
    items: [
      { to: '/pengguna', label: 'Pengguna & peran admin', icon: ShieldCheck },
      { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
    ],
  },
]

const ALL_ITEMS = NAV.flatMap((g) => g.items)

function NavItem({ to, label, icon: Icon }) {
  const isActive = usePathname() === to
  return (
    <Link href={to} className={`nav-link ${isActive ? 'is-active' : ''}`} aria-current={isActive ? 'page' : undefined}>
      <Icon strokeWidth={1.75} />
      {label}
    </Link>
  )
}

function Sidebar() {
  const { toast } = useOverlay()
  return (
    <aside className="sidebar" aria-label="Navigasi administrator">
      <div className="brand">
        <div className="brand__mark">
          <Image src={asset('brand-mark.svg')} alt="" width={30} height={30} />
          <span className="brand__name">TKBJ</span>
        </div>
        <p className="brand__org">Taman Krida Budaya Jawa Timur</p>
        <p className="brand__panel">PANEL ADMINISTRATOR</p>
      </div>
      <div className="divider" />
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {NAV.map((g, i) =>
          g.group ? (
            <div className="nav-group" key={g.group}>
              <p className="nav-group__label">{g.group}</p>
              {g.items.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          ) : (
            g.items.map((item) => <NavItem key={i + item.to} {...item} />)
          ),
        )}
      </nav>
      <div className="sidebar__spacer" />
      <button
        className="public-app"
        onClick={() => toast('Tampilan publik ada di halaman "📱 Aplikasi Mobile (Pengguna)"', 'info')}
      >
        Aplikasi publik TKBJ
        <span className="public-app__link">
          Lihat tampilan publik <ArrowUpRight strokeWidth={2} />
        </span>
      </button>
      <p className="sidebar__address">
        Disbudpar Provinsi Jawa Timur
        <br />
        Jl. Soekarno-Hatta No. 7, Malang
      </p>
    </aside>
  )
}

function Topbar({ title, onMenu }) {
  const { showDetail, toast } = useOverlay()
  const router = useRouter()
  // Sesi bisa kosong sesaat ketika logout sebelum dialihkan ke /login.
  const { user = {}, loginAt } = useSession() ?? {}
  const [query, setQuery] = useState('')

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
        <form
          className="global-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            if (query.trim()) toast(`Contoh prototype: mencari "${query.trim()}"`, 'info')
          }}
        >
          <Search strokeWidth={1.75} />
          <input
            type="search"
            aria-label="Pencarian global"
            placeholder="Cari acara, pesanan, pengguna..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        <span className="badge badge--primary data-flag">Data contoh</span>
        <button
          className="icon-btn"
          aria-label="Notifikasi"
          onClick={() =>
            showDetail({
              title: 'Notifikasi',
              subtitle: '3 pemberitahuan terbaru',
              rows: [
                ['09.25 WIB', 'Pembayaran TK-1026-0128 dikonfirmasi'],
                ['08.50 WIB', 'Permintaan sewa SG-1026-0018 masuk'],
                ['08.35 WIB', '6 foto ditambahkan ke virtual galeri'],
              ],
              cancelLabel: 'Tutup',
              primaryLabel: 'Tandai dibaca',
              success: 'Semua notifikasi ditandai dibaca',
            })
          }
        >
          <Bell strokeWidth={1.75} />
          <span className="icon-btn__dot" />
        </button>
        <div className="topbar__sep" />
        <button
          className="account"
          onClick={() =>
            showDetail({
              title: 'Akun Administrator',
              subtitle: 'Masuk sebagai Administrator TKBJ. Kelola akun atau keluar dari panel.',
              rows: [
                ['Nama', user.name],
                ['Peran', user.role],
                ['Username', user.username],
                ['Masuk sejak', new Date(loginAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })],
              ],
              cancelLabel: 'Tutup',
              primaryLabel: 'Keluar',
              success: 'Anda telah keluar dari panel',
              onPrimary: () => {
                auth.logout()
                router.replace('/login')
              },
            })
          }
        >
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

export default function Layout({ children }) {
  const pathname = usePathname()
  // Drawer navigasi (layar kecil) otomatis tertutup saat rute berubah.
  const [navOpenAt, setNavOpenAt] = useState(null)
  const navOpen = navOpenAt === pathname
  const current = ALL_ITEMS.find((i) => i.to === pathname) ?? ALL_ITEMS[0]

  return (
    <div className={`app ${navOpen ? 'nav-open' : ''}`}>
      <Sidebar />
      <div className="sidebar-backdrop" onClick={() => setNavOpenAt(null)} />
      <div className="workspace">
        <Topbar title={current.label} onMenu={() => setNavOpenAt(pathname)} />
        <main className="page">
          {children}
        </main>
      </div>
    </div>
  )
}
