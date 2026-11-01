'use client'

import { useState } from 'react'
import { Building2, CalendarCheck, CircleCheck, FileText, Images, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { Card, ErrorBanner } from '@/components/ui'
import { relativeTime, wibDateTime } from '@/data/format'
import { api, useQuery } from '@/lib/api'
import { useAccess } from '@/lib/access'
import type { Module } from '@/lib/access'

const ACTIVITY_REFRESH_MS = 15000
const ACTIVITY_PAGE = 6

const ACTIVITY_ICONS = {
  payment: CircleCheck,
  event: CalendarCheck,
  rental: Building2,
  community: Users,
  content: FileText,
  gallery: Images,
  user: ShieldCheck,
  system: RefreshCw,
}
/** [label, jenis, modul]. Chip modul yang tidak boleh dilihat peran ini disembunyikan. */
const ACTIVITY_FILTERS: [string, string, Module?][] = [
  ['Semua', ''],
  ['Pembayaran', 'payment', 'payments'],
  ['Acara', 'event', 'events'],
  ['Sewa', 'rental', 'rentals'],
  ['Komunitas', 'community', 'info'],
]

type Activity = { id: number; kind: string; title: string; sub: string; createdAt: string }

const byIdDesc = (lists: Activity[][]) => [...new Map(lists.flat().map((a) => [a.id, a])).values()].sort((a, b) => b.id - a.id)

/** Log aktivitas: filter jenis, muat lebih banyak, sorot entri baru. */
export default function AktivitasTerbaru() {
  const { canView } = useAccess()
  const [kind, setKind] = useState('')
  const key = `/activity?limit=${ACTIVITY_PAGE}${kind ? `&kind=${kind}` : ''}`
  const { data, error, reload } = useQuery(key, { refreshInterval: ACTIVITY_REFRESH_MS })
  // Halaman lama yang dimuat lewat "Muat lebih banyak", per filter.
  const [older, setOlder] = useState<{ kind: string; items: Activity[]; done: boolean }>({ kind, items: [], done: false })
  const [loadingMore, setLoadingMore] = useState(false)
  // Entri dengan id di atas batas ini (per filter) muncul setelah halaman dibuka → disorot.
  const [baseline, setBaseline] = useState<Record<string, number>>({})
  if (data && baseline[kind] === undefined) setBaseline({ ...baseline, [kind]: data.items[0]?.id ?? 0 })

  const pool = older.kind === kind ? older : { items: [], done: false }
  const items = byIdDesc([data?.items ?? [], pool.items])
  const done = pool.done || (data && !data.nextCursor)

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const res = await api(`${key}&before=${items.at(-1).id}`)
      setOlder({ kind, items: byIdDesc([items, res.items]), done: !res.nextCursor })
    } catch {
      // Tombol tetap tersedia untuk dicoba lagi.
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <Card title="Aktivitas terbaru" subtitle="Diperbarui otomatis tiap 15 detik" style={{ gap: 16 }}>
      <div className="chips" role="tablist" aria-label="Jenis aktivitas">
        {ACTIVITY_FILTERS.filter(([, , m]) => canView(m)).map(([label, value]) => (
          <button key={label} role="tab" aria-selected={kind === value} className={`chip ${kind === value ? 'is-active' : ''}`} onClick={() => setKind(value)}>
            {label}
          </button>
        ))}
      </div>
      <ErrorBanner error={error} onRetry={reload} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 17 }}>
        {items.map((a) => {
          const Icon = ACTIVITY_ICONS[a.kind] ?? CircleCheck
          const fresh = baseline[kind] !== undefined && a.id > baseline[kind]
          return (
            <div className={`activity ${fresh ? 'is-new' : ''}`} key={a.id}>
              <span className={`activity__icon activity__icon--${a.kind}`}>
                <Icon strokeWidth={1.75} />
              </span>
              <div className="activity__info">
                <p className="activity__title">{a.title}</p>
                <p>{a.sub}</p>
                <p title={wibDateTime(a.createdAt)}>{relativeTime(a.createdAt)}</p>
              </div>
            </div>
          )
        })}
        {data && !items.length && <p className="empty-note">Belum ada aktivitas untuk jenis ini.</p>}
        {!data && !error && <p className="empty-note">Memuat aktivitas…</p>}
      </div>
      <div className="divider" />
      <button className="link" onClick={loadMore} disabled={done || loadingMore || !items.length}>
        {done ? 'Semua aktivitas sudah ditampilkan' : loadingMore ? 'Memuat…' : 'Muat aktivitas sebelumnya →'}
      </button>
    </Card>
  )
}
