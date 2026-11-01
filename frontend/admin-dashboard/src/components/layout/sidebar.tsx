'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { useOverlay } from '../overlay'
import { asset } from '../../data/sample'
import { useAccess } from '../../lib/access'
import { NAV } from './menu'
import type { MenuItem } from './menu'

function NavItem({ to, label, icon: Icon }: MenuItem) {
  const isActive = usePathname() === to
  return (
    <Link href={to} className={`nav-link ${isActive ? 'is-active' : ''}`} aria-current={isActive ? 'page' : undefined}>
      <Icon strokeWidth={1.75} />
      {label}
    </Link>
  )
}

/** Sidebar kiri: logo, menu navigasi (hanya modul yang boleh dilihat peran ini), tautan aplikasi publik, dan alamat. */
export default function Sidebar() {
  const { toast } = useOverlay()
  const { canView } = useAccess()
  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((item) => canView(item.module)) })).filter((g) => g.items.length)
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
        {groups.map((g, i) =>
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
