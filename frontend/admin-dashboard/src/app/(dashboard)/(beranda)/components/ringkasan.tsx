'use client'

import { Building2, Calendar, CalendarDays, ChevronDown, Ticket, Wallet } from 'lucide-react'
import { AnimatedNumber, Metrics, Period } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { formatJuta, round } from '@/data/finance'
import { longDate, periodShort, wibTime } from '@/data/format'
import { useAccess } from '@/lib/access'
import type { Module } from '@/lib/access'
import type { MetricProps } from '@/components/ui'

const fmtPct = (n: number) => Math.abs(n).toLocaleString('id-ID', { maximumFractionDigits: 1 })

/** Perbandingan dengan periode sebelumnya, untuk kartu metrik. */
function compare(current, previous, label: string, { count = false, upIsGood = true } = {}) {
  if (current === undefined || current === null) return undefined
  if (previous === undefined || previous === null) return { text: `Belum ada data ${label}` }
  const diff = count ? current - previous : previous ? (current / previous - 1) * 100 : null
  if (diff === null) return { text: `Belum ada data ${label}` }
  if (diff === 0) return { text: `Sama dengan ${label}` }
  const up = diff > 0
  return { up, good: up === upIsGood, text: `${up ? '+' : '−'}${count ? Math.abs(diff) : `${fmtPct(diff)}%`} vs ${label}` }
}

/** Pemilih periode + kartu metrik ringkasan (acara, tiket, sewa, pembayaran). */
export default function Ringkasan({ summary: s, onPeriod }: { summary: any; onPeriod: (key: string) => void }) {
  const overlay = useOverlay()
  const { canView } = useAccess()
  const m = s?.metrics
  const pm = s?.previousMetrics
  const prev = s ? periodShort(s.previous.key) : ''
  const pct = m?.tickets.quota ? Math.round((m.tickets.sold / m.tickets.quota) * 100) : 0

  const choosePeriod = () =>
    overlay.showChoice({
      title: 'Pilih periode',
      subtitle: 'Metrik ringkasan dihitung ulang oleh server untuk periode terpilih.',
      options: s.periods.map((p) => p.label),
      value: s.period.label,
      onChoose: (label) => onPeriod(s.periods.find((p) => p.label === label).key),
    })

  return (
    <>
      <Period
        label="Ringkasan"
        stamp={
          s
            ? `Diperbarui ${wibTime(s.generatedAt)} · otomatis tiap 30 detik · hari ini pada data contoh: ${longDate(s.today)}`
            : 'Memuat ringkasan dari server…'
        }
      >
        <button className="period-picker" onClick={choosePeriod} disabled={!s}>
          <Calendar strokeWidth={1.75} /> {s?.period.label ?? '…'} <ChevronDown strokeWidth={1.75} />
        </button>
      </Period>

      <Metrics
        items={(
          [
          {
            module: 'events',
            label: 'Acara',
            icon: CalendarDays,
            href: '/acara',
            value: <AnimatedNumber value={m?.events.total} />,
            hint: m ? `${m.events.published} terpublikasi · ${m.events.draft} draf` : 'Memuat…',
            trend: compare(m?.events.total, pm?.events.total, prev, { count: true }),
          },
          {
            module: 'events',
            label: 'Tiket terjual',
            icon: Ticket,
            href: '/tiket',
            value: <AnimatedNumber value={m?.tickets.sold} />,
            progress: m ? pct : undefined,
            hint: m ? `${pct}% dari ${m.tickets.quota.toLocaleString('id-ID')} kuota · ${m.tickets.events} acara bertiket` : 'Memuat…',
            trend: compare(m?.tickets.sold, pm?.tickets.quota ? pm.tickets.sold : null, prev),
          },
          {
            module: 'rentals',
            label: 'Pemesanan gedung',
            icon: Building2,
            href: '/sewa',
            value: <AnimatedNumber value={m?.rentals.total} />,
            hint: m ? `${m.rentals.approved} disetujui · ${m.rentals.pending} perlu ditinjau` : 'Memuat…',
            trend: compare(m?.rentals.total, pm?.rentals.total, prev, { count: true }),
          },
          {
            module: 'payments',
            label: 'Pembayaran diterima',
            icon: Wallet,
            href: '/transaksi',
            value: <AnimatedNumber value={m ? (m.revenue?.total ?? 0) : null} format={(n) => formatJuta(round(n))} />,
            hint: m?.revenue ? `Tiket ${formatJuta(m.revenue.ticket)} · sewa ${formatJuta(m.revenue.rental)}` : m ? 'Belum ada rekap periode ini' : 'Memuat…',
            trend: compare(m?.revenue?.total, pm?.revenue?.total, prev),
          },
          ] as (MetricProps & { module: Module })[]
        )
          // Kartu hanya untuk modul yang boleh dilihat peran ini.
          .filter((item) => canView(item.module))
          .map(({ module: _module, ...item }) => item)}
      />
    </>
  )
}
