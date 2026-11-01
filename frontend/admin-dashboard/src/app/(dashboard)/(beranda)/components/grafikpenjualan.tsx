'use client'

import { useCallback, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, MousePointerClick } from 'lucide-react'
import { Card, Cell, DataTable, ErrorBanner, Tabs } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { formatJuta, round } from '@/data/finance'
import { saveCsv, useQuery } from '@/lib/api'

/* Warna seri tetap per entitas (bukan per urutan), divalidasi untuk buta warna:
   penjualan = marun, pembelian = emas. Lihat --c-chart-* di index.css. */
const SERIES = [
  { key: 'penjualan', label: 'Penjualan', color: 'var(--c-chart-sales)' },
  { key: 'pembelian', label: 'Pembelian', color: 'var(--c-chart-purchase)' },
]
const VIEWS = ['Batang', 'Garis', 'Tabel']
const NONE = []

const HEIGHT = 260
const PAD = { top: 14, bottom: 28, left: 52 }

const total = (rows, key) => round(rows.reduce((sum, r) => sum + r[key], 0))

/** Kelipatan rapi untuk sumbu Y (0, 10, 20, ... jt). */
function niceTicks(max) {
  const step = [5, 10, 20, 25, 50, 100].find((s) => max / s <= 5) ?? 100
  const ticks = []
  for (let t = 0; t <= Math.ceil(max / step) * step; t += step) ticks.push(t)
  return ticks
}

/** Batang dengan ujung data membulat 4px dan pangkal rata di garis dasar. */
function barPath(x, base, w, h) {
  if (h <= 0) return ''
  const r = Math.min(4, w / 2, h)
  const top = base - h
  return `M${x},${base}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${base}Z`
}

function useWidth() {
  const [width, setWidth] = useState(0)
  const ref = useCallback((el: HTMLElement | null) => {
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/** Perubahan rata-rata per bulan terhadap bulan-bulan sebelumnya yang tersedia. */
function Delta({ rows, prev, seriesKey, upIsGood }) {
  if (!prev.length) return <p className="chart-stat__delta">Data contoh dimulai Januari 2026</p>
  const avg = (list) => total(list, seriesKey) / list.length
  const pct = (avg(rows) / avg(prev) - 1) * 100
  const up = pct >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  const period = prev.length === rows.length ? `${prev.length} bulan sebelumnya` : `rata-rata ${prev.length} bulan sebelumnya`
  return (
    <p className={`chart-stat__delta ${up === upIsGood ? 'is-good' : 'is-bad'}`}>
      <Icon strokeWidth={2} />
      {up ? '+' : '−'}
      {Math.abs(pct).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
      <span> vs {period}</span>
    </p>
  )
}

export default function GrafikPenjualan() {
  const overlay = useOverlay()
  const finance = useQuery('/finance/monthly')
  const [range, setRange] = useState('6 bulan')
  const [view, setView] = useState('Batang')
  const [shown, setShown] = useState({ penjualan: true, pembelian: true })
  const [active, setActive] = useState(null)
  const [wrapRef, width] = useWidth()

  const MONTHLY = finance.data?.months ?? NONE
  const PURCHASE_CATEGORIES = finance.data?.categories ?? NONE
  if (!MONTHLY.length)
    return (
      <Card className="chart-card" title="Grafik penjualan & pembelian" subtitle="Memuat rekap keuangan…">
        <ErrorBanner error={finance.error} onRetry={finance.reload} />
        {!finance.error && <div className="skeleton" style={{ height: HEIGHT }} />}
      </Card>
    )

  const year = MONTHLY.at(-1).key.slice(0, 4)
  const RANGES = { '3 bulan': 3, '6 bulan': 6, [`${MONTHLY[0].month}–${MONTHLY.at(-1).month} ${year}`]: MONTHLY.length }
  const topPurchase = (d) => {
    const k = d.purchases.indexOf(Math.max(...d.purchases))
    return `${PURCHASE_CATEGORIES[k]} ${formatJuta(d.purchases[k])}`
  }

  const n = RANGES[range] ?? 6
  const data = MONTHLY.slice(-n)
  const prev = MONTHLY.slice(Math.max(MONTHLY.length - 2 * n, 0), -n)
  const visible = SERIES.filter((s) => shown[s.key])

  const sales = total(data, 'penjualan')
  const purchases = total(data, 'pembelian')
  const net = round(sales - purchases)

  const toggle = (key) => {
    // Minimal satu seri tetap tampil agar grafik tidak kosong.
    if (shown[key] && visible.length === 1) return
    setShown((s) => ({ ...s, [key]: !s[key] }))
  }

  const openMonth = (d) => {
    const rows: [string, number][] = [
      ['Penjualan tiket', d.sales.tiket],
      ['Sewa gedung', d.sales.sewa],
      ['Total penjualan', d.penjualan],
      ...PURCHASE_CATEGORIES.map((c, k): [string, number] => [c, d.purchases[k]]),
      ['Total pembelian', d.pembelian],
      ['Selisih', round(d.penjualan - d.pembelian)],
    ]
    overlay.showDetail({
      title: `Rincian ${d.label}`,
      subtitle: 'Penjualan & pembelian · data contoh',
      rows: rows.map(([label, value]) => [label, formatJuta(value)]),
      primaryLabel: 'Unduh rincian (CSV)',
      // Nilai disimpan dalam juta rupiah, sama dengan grafik.
      onPrimary: () => {
        saveCsv(`rincian-keuangan-${d.month.toLowerCase()}-${year}.csv`, [['Komponen', 'Nominal (juta Rp)'], ...rows])
      },
      success: `Rincian ${d.label} diunduh`,
    })
  }

  // ---- Geometri grafik ----
  const isLine = view === 'Garis'
  const padRight = isLine ? 70 : 12
  const innerW = Math.max(width - PAD.left - padRight, 0)
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const base = PAD.top + innerH
  const band = innerW / data.length
  const ticks = niceTicks(Math.max(...data.flatMap((d) => visible.map((s) => d[s.key]))))
  const yMax = ticks.at(-1)
  const y = (v) => base - (v / yMax) * innerH
  const cx = (i) => PAD.left + band * (i + 0.5)

  const barW = Math.max(Math.min(24, (band * 0.64 - 2 * (visible.length - 1)) / visible.length), 2)
  const groupW = visible.length * barW + (visible.length - 1) * 2

  // Label nilai di ujung garis — dilewati bila kedua label bertabrakan (legenda + tooltip tetap membawa nilainya).
  const last = data.at(-1)
  const endLabels = visible.map((s) => ({ ...s, y: y(last[s.key]), value: last[s.key] }))
  const showEndLabels = endLabels.length < 2 || Math.abs(endLabels[0].y - endLabels[1].y) >= 14

  const activeRow = active !== null ? data[active] : null
  const tipLeft = active !== null && cx(active) > width - 250

  return (
    <Card
      className="chart-card"
      title="Grafik penjualan & pembelian"
      subtitle="Penjualan tiket & sewa gedung dibanding belanja operasional · bertambah otomatis saat pembayaran diverifikasi"
      action={<Tabs items={Object.keys(RANGES)} value={range} onChange={(r) => {
            setRange(r)
            setActive(null)
          }} />}
    >
      <div className="chart-stats">
        <div className="chart-stat">
          <p className="chart-stat__label">
            <span className="chart-key" style={{ background: SERIES[0].color }} /> Total penjualan
          </p>
          <p className="chart-stat__value">{formatJuta(sales)}</p>
          <Delta rows={data} prev={prev} seriesKey="penjualan" upIsGood />
        </div>
        <div className="chart-stat">
          <p className="chart-stat__label">
            <span className="chart-key" style={{ background: SERIES[1].color }} /> Total pembelian
          </p>
          <p className="chart-stat__value">{formatJuta(purchases)}</p>
          <Delta rows={data} prev={prev} seriesKey="pembelian" upIsGood={false} />
        </div>
        <div className="chart-stat">
          <p className="chart-stat__label">Selisih (penjualan − pembelian)</p>
          <p className="chart-stat__value">{formatJuta(net)}</p>
          <p className="chart-stat__delta">
            Margin {((net / sales) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}% dari penjualan
          </p>
        </div>
      </div>

      <div className="chart-toolbar">
        <div className="chart-legend" role="group" aria-label="Tampilkan seri">
          {SERIES.map((s) => (
            <button
              key={s.key}
              type="button"
              className="chart-legend__item"
              aria-pressed={shown[s.key]}
              title={shown[s.key] ? `Sembunyikan ${s.label.toLowerCase()}` : `Tampilkan ${s.label.toLowerCase()}`}
              onClick={() => toggle(s.key)}
            >
              <span className={`chart-key ${isLine ? 'chart-key--line' : ''}`} style={{ background: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
        <Tabs items={VIEWS} value={view} onChange={(v) => {
            setView(v)
            setActive(null)
          }} />
      </div>

      {view === 'Tabel' ? (
        <DataTable
          columns={[
            { label: 'Bulan', width: 'minmax(110px, 0.8fr)', render: (d) => <Cell main={d.label} /> },
            {
              label: 'Penjualan',
              width: 'minmax(170px, 1fr)',
              render: (d) => (
                <Cell main={formatJuta(d.penjualan)} sub={`Tiket ${formatJuta(d.sales.tiket)} · sewa ${formatJuta(d.sales.sewa)}`} />
              ),
            },
            {
              label: 'Pembelian',
              width: 'minmax(190px, 1fr)',
              render: (d) => <Cell main={formatJuta(d.pembelian)} sub={`Terbesar: ${topPurchase(d)}`} />,
            },
            {
              label: 'Selisih',
              width: 'minmax(90px, 0.6fr)',
              render: (d) => <Cell main={formatJuta(round(d.penjualan - d.pembelian))} />,
            },
          ]}
          rows={data}
          getKey={(d) => d.month}
          onRowClick={openMonth}
        />
      ) : (
        <div className="chart" ref={wrapRef} onPointerLeave={() => setActive(null)}>
          {width > 0 && (
            <svg
              width={width}
              height={HEIGHT}
              role="img"
              aria-label={`Grafik ${view.toLowerCase()} ${visible.map((s) => s.label.toLowerCase()).join(' dan ')}, ${data[0].label} sampai ${last.label}`}
            >
              {!isLine && active !== null && (
                <rect className="chart__band" x={PAD.left + band * active} y={PAD.top} width={band} height={innerH} rx={6} />
              )}

              {ticks.map((t) => (
                <g key={t}>
                  <line className="chart__grid" x1={PAD.left} x2={PAD.left + innerW} y1={y(t)} y2={y(t)} />
                  <text className="chart__axis" x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                    {t === 0 ? 'Rp0' : `Rp${t} jt`}
                  </text>
                </g>
              ))}
              {data.map((d, i) => (
                <text key={d.month} className="chart__axis" x={cx(i)} y={base + 18} textAnchor="middle">
                  {d.month}
                </text>
              ))}

              {!isLine &&
                data.map((d, i) =>
                  visible.map((s, j) => (
                    <path
                      key={`${range}-${d.month}-${s.key}`}
                      className="chart__bar"
                      d={barPath(cx(i) - groupW / 2 + j * (barW + 2), base, barW, base - y(d[s.key]))}
                      fill={s.color}
                      opacity={active === null || active === i ? 1 : 0.55}
                    />
                  )),
                )}

              {isLine && (
                <>
                  {active !== null && (
                    <line className="chart__crosshair" x1={cx(active)} x2={cx(active)} y1={PAD.top} y2={base} />
                  )}
                  {visible.map((s) => (
                    <g key={s.key}>
                      <path
                        className="chart__line"
                        d={data.map((d, i) => `${i ? 'L' : 'M'}${cx(i)},${y(d[s.key])}`).join('')}
                        stroke={s.color}
                      />
                      {data.map((d, i) => (
                        <circle
                          key={d.month}
                          className="chart__dot"
                          cx={cx(i)}
                          cy={y(d[s.key])}
                          r={active === i ? 5.5 : 4}
                          fill={s.color}
                        />
                      ))}
                    </g>
                  ))}
                  {showEndLabels &&
                    endLabels.map((l) => (
                      <text key={l.key} className="chart__end-label" x={cx(data.length - 1) + 10} y={l.y} dy="0.32em">
                        {formatJuta(l.value)}
                      </text>
                    ))}
                </>
              )}

              {/* Area sentuh selebar satu bulan — lebih besar dari tandanya, juga bisa difokus dengan keyboard. */}
              {data.map((d, i) => (
                <rect
                  key={d.month}
                  className="chart__hit"
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={innerH + PAD.bottom}
                  tabIndex={0}
                  role="button"
                  aria-label={`${d.label}: penjualan ${formatJuta(d.penjualan)}, pembelian ${formatJuta(d.pembelian)}. Tekan Enter untuk rincian.`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => openMonth(d)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return
                    e.preventDefault()
                    openMonth(d)
                  }}
                />
              ))}
            </svg>
          )}

          {activeRow && (
            <div
              className={`chart-tip ${tipLeft ? 'chart-tip--left' : ''}`}
              style={{ left: tipLeft ? cx(active) - 14 : cx(active) + 14, top: PAD.top }}
              aria-hidden="true"
            >
              <p className="chart-tip__title">{activeRow.label}</p>
              {visible.map((s) => (
                <div key={s.key} className="chart-tip__row">
                  <span className="chart-tip__key" style={{ background: s.color }} />
                  <div>
                    <p>
                      <strong>{formatJuta(activeRow[s.key])}</strong> {s.label.toLowerCase()}
                    </p>
                    <p className="chart-tip__sub">
                      {s.key === 'penjualan'
                        ? `Tiket ${formatJuta(activeRow.sales.tiket)} · sewa ${formatJuta(activeRow.sales.sewa)}`
                        : `Terbesar: ${topPurchase(activeRow)}`}
                    </p>
                  </div>
                </div>
              ))}
              <p className="chart-tip__foot">
                Selisih <strong>{formatJuta(round(activeRow.penjualan - activeRow.pembelian))}</strong>
              </p>
              <p className="chart-tip__hint">
                <MousePointerClick strokeWidth={1.75} /> Klik untuk rincian
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
