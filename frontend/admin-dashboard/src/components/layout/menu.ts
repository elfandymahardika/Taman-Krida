import {
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  FolderOpen,
  Images,
  LayoutDashboard,
  Map,
  Settings,
  ShieldCheck,
  StickyNote,
  Ticket,
  Users,
} from 'lucide-react'
import type { ElementType } from 'react'
import { moduleOf } from '../../lib/access'
import type { Module } from '../../lib/access'

/** `module` = modul hak akses halaman ini (lihat lib/access.ts); kosong = terbuka untuk semua staf. */
export type MenuItem = { to: string; label: string; icon: ElementType; module?: Module }

/** Menu sidebar, dikelompokkan per bagian. `group: null` = tanpa judul kelompok. */
export const NAV: { group: string | null; items: MenuItem[] }[] = [
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
    // Terbuka untuk semua staf; data dibatasi per pemilik di backend.
    group: 'Ruang kerja',
    items: [
      { to: '/catatan', label: 'Catatan staf', icon: StickyNote },
      { to: '/dokumen', label: 'Dokumen', icon: FolderOpen },
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

// Modul tiap menu diambil dari peta halaman → modul yang sama dengan guard halaman.
for (const g of NAV) for (const item of g.items) item.module = moduleOf(item.to)

export const ALL_ITEMS = NAV.flatMap((g) => g.items)
