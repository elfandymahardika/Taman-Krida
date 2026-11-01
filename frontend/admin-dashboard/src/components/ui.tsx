'use client'

import { useEffect, useRef, useState } from 'react'
import type { ComponentProps, CSSProperties, ElementType, ReactNode } from 'react'
import type { StaticImageData } from 'next/image'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronRight, Info, Search } from 'lucide-react'

/* Warna status mengikuti desain: hijau = selesai/aktif, kuning = perlu tindakan,
   merah marun = sorotan, abu = menunggu/draf. */
export type Tone = 'success' | 'warning' | 'primary' | 'neutral'

const TONES: Record<string, Tone> = {
  Lunas: 'success',
  Terpublikasi: 'success',
  'Tiket aktif': 'success',
  Disetujui: 'success',
  Aktif: 'success',
  Terverifikasi: 'success',
  Tayang: 'success',
  Publik: 'success',
  Selesai: 'success',
  'Perlu verifikasi': 'warning',
  'Perlu ditinjau': 'warning',
  'Menunggu persetujuan': 'warning',
  Diproses: 'warning',
  Terjadwal: 'warning',
  Undangan: 'warning',
  'Hari ini': 'primary',
  Ditolak: 'primary',
  Nonaktif: 'neutral',
  Draf: 'neutral',
  'Menunggu bayar': 'neutral',
  'Belum terbit': 'neutral',
  Internal: 'neutral',
  Diarsipkan: 'neutral',
}

export function Badge({ children, tone }: { children: ReactNode; tone?: Tone }) {
  const t = tone ?? TONES[String(children)] ?? 'neutral'
  return <span className={`badge badge--${t}`}>{children}</span>
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        <h1 className="page-header__title">{title}</h1>
        <p className="page-header__sub">{subtitle}</p>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  )
}

export const DATA_STAMP = 'Data contoh dari backend · hari ini pada data contoh: Jumat, 2 Oktober 2026'

export function Period({
  label = 'Oktober 2026',
  stamp = DATA_STAMP,
  children,
}: {
  label?: ReactNode
  stamp?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="period">
      <div className="period__label">
        {label}
        {children}
      </div>
      <p className="period__stamp">{stamp}</p>
    </div>
  )
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Angka yang beranimasi dari nilai lama ke nilai baru. `value` null → "—". */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString('id-ID'),
  duration = 650,
}: {
  value: number | null | undefined
  format?: (n: number) => ReactNode
  duration?: number
}) {
  const [shown, setShown] = useState(value ?? 0)
  const from = useRef(value ?? 0)

  useEffect(() => {
    if (value === null || value === undefined) return
    const start = from.current
    if (start === value || prefersReducedMotion()) {
      from.current = value
      setShown(value)
      return
    }
    let frame: number
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1)
      const eased = 1 - (1 - p) ** 3
      const current = start + (value - start) * eased
      from.current = current
      setShown(current)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  if (value === null || value === undefined) return '—'
  return format(shown)
}

/**
 * Kartu metrik. Opsional: `href` (kartu menjadi tautan), `trend` ({ text, good }),
 * dan `progress` (0–100) untuk bilah kemajuan.
 */
export type MetricProps = {
  label: string
  icon?: ElementType
  value: ReactNode
  hint?: ReactNode
  href?: string
  trend?: { text: ReactNode; good?: boolean; up?: boolean }
  progress?: number
}

export function Metric({ label, icon: Icon, value, hint, href, trend, progress }: MetricProps) {
  const body = (
    <>
      <div className="metric__label">
        {label}
        {Icon && <Icon strokeWidth={1.75} />}
      </div>
      <p className="metric__value">{value}</p>
      {progress !== undefined && <Progress value={progress} />}
      <p className="metric__hint">{hint}</p>
      {trend && (
        <p className={`metric__trend ${trend.good === undefined ? '' : trend.good ? 'is-good' : 'is-bad'}`}>
          {trend.up !== undefined && (trend.up ? <ArrowUpRight strokeWidth={2} /> : <ArrowDownRight strokeWidth={2} />)}
          {trend.text}
        </p>
      )}
    </>
  )
  return href ? (
    <Link href={href} className="metric metric--link">
      {body}
      <ChevronRight className="metric__go" strokeWidth={1.75} />
    </Link>
  ) : (
    <div className="metric">{body}</div>
  )
}

/** Kartu pemberitahuan bila data dari API gagal dimuat. */
export function ErrorBanner({ error, onRetry }: { error?: { message: string } | null; onRetry?: () => void }) {
  if (!error) return null
  return (
    <div className="api-error" role="alert">
      <Info strokeWidth={1.75} />
      <div>
        <p className="api-error__title">Data belum bisa dimuat</p>
        <p>{error.message}</p>
      </div>
      {onRetry && (
        <button className="btn" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  )
}

export function Metrics({ items }: { items: MetricProps[] }) {
  return (
    <div className={`metrics ${items.length < 4 ? `metrics--${items.length}` : ''}`}>
      {items.map((m) => (
        <Metric key={m.label} {...m} />
      ))}
    </div>
  )
}

export function SectionHead({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div className="section-head__text">
        <h2 className="section-head__title" style={{ margin: 0, fontWeight: 400 }}>
          {title}
        </h2>
        {subtitle && <p className="section-head__sub">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  style,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children?: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <section className={`card ${className}`} style={style}>
      {title && <SectionHead title={title} subtitle={subtitle} action={action} />}
      {children}
    </section>
  )
}

export type SearchFieldProps = { placeholder?: string; value?: string; onChange?: (value: string) => void }

export function SearchField({ placeholder, value, onChange }: SearchFieldProps) {
  return (
    <label className="search-field">
      <Search strokeWidth={1.75} />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </label>
  )
}

export type SelectProps = { value?: string; onChange?: (value: string) => void; options: string[]; label?: string }

export function Select({ value, onChange, options, label }: SelectProps) {
  return (
    <label className="select">
      <span className="sr-only">{label ?? options[0]}</span>
      <select value={value} onChange={(e) => onChange?.(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown strokeWidth={1.75} />
    </label>
  )
}

export function Filters({ search, selects = [] }: { search: SearchFieldProps; selects?: SelectProps[] }) {
  return (
    <div className="filters">
      <SearchField {...search} />
      {selects.map((s, i) => (
        <Select key={i} {...s} />
      ))}
    </div>
  )
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  size,
}: {
  items: readonly T[]
  value: T
  onChange: (value: T) => void
  size?: 'lg'
}) {
  return (
    <div className={`tabs ${size === 'lg' ? 'tabs--lg' : ''}`} role="tablist">
      {items.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={t === value}
          className={`tab ${t === value ? 'is-active' : ''}`}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

/** Sel dua baris (judul + keterangan) seperti pada tabel desain. */
export function Cell({ main, sub, size }: { main: ReactNode; sub?: ReactNode; size?: 'lg' }) {
  return (
    <div className={`cell ${size === 'lg' ? 'cell--lg' : ''}`}>
      <p className="cell__main">{main}</p>
      {sub && <p className="cell__sub">{sub}</p>}
    </div>
  )
}

/**
 * Tabel berbasis grid dengan lebar kolom tetap sesuai desain.
 * columns: [{ label, width, render(row) }]
 */
export type Column<T> = { label: string; width: number | string; render: (row: T) => ReactNode }

// Default `any`: baris dari API belum bertipe.
export function DataTable<T = any>({
  columns,
  rows,
  onRowClick,
  selected,
  getKey,
  footer,
}: {
  columns: Column<NoInfer<T>>[]
  rows: T[]
  onRowClick?: (row: T, key: string | number) => void
  selected?: string | number | null
  getKey?: (row: T) => string | number
  footer?: ReactNode
}) {
  const template = columns.map((c) => (typeof c.width === 'number' ? `${c.width}px` : c.width)).join(' ')
  return (
    <div className="table-wrap">
      <div className="table" role="table">
        <div className="table__head" role="row" style={{ gridTemplateColumns: template }}>
          {columns.map((c) => (
            <span key={c.label} role="columnheader">
              {c.label}
            </span>
          ))}
        </div>
        {rows.map((row, i) => {
          const key = getKey ? getKey(row) : i
          const Tag = onRowClick ? 'button' : 'div'
          return (
            <Tag
              key={key}
              role="row"
              className={`table__row ${selected === key ? 'is-selected' : ''}`}
              style={{ gridTemplateColumns: template }}
              onClick={onRowClick ? () => onRowClick(row, key) : undefined}
            >
              {columns.map((c) => (
                <div key={c.label} role="cell" style={{ minWidth: 0 }}>
                  {c.render(row)}
                </div>
              ))}
            </Tag>
          )
        })}
      </div>
      {footer}
    </div>
  )
}

/** Ringkasan tabel + paginasi. `pages` = jumlah halaman, `page` berbasis 0. */
export function TableFoot({
  children,
  page = 0,
  pages = 1,
  onPage,
}: {
  children?: ReactNode
  page?: number
  pages?: number
  onPage?: (page: number) => void
}) {
  return (
    <div className="table__foot">
      <p>{children}</p>
      {onPage && (
        <div className="pager">
          <button aria-label="Halaman sebelumnya" disabled={page === 0} onClick={() => onPage(page - 1)}>
            ‹
          </button>
          <span>
            {page + 1} / {pages}
          </span>
          <button aria-label="Halaman berikutnya" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>
            ›
          </button>
        </div>
      )}
    </div>
  )
}

export function DetailRow({ label, children }: { label: ReactNode; children?: ReactNode }) {
  return (
    <div className="detail-row">
      <p className="detail-row__label">{label}</p>
      <div className="detail-row__value">{children}</div>
    </div>
  )
}

export function Note({ children, tone }: { children: ReactNode; tone?: 'info' }) {
  return (
    <div className={`note ${tone === 'info' ? 'note--info' : ''}`}>
      <Info strokeWidth={1.75} />
      <p>{children}</p>
    </div>
  )
}

/** Atribut bersama input/textarea/select; `as` memilih elemen yang dirender. */
export type FieldProps = Omit<ComponentProps<'input'> & ComponentProps<'textarea'> & ComponentProps<'select'>, 'as'> & {
  label: ReactNode
  as?: 'input' | 'textarea' | 'select'
  options?: readonly string[]
  error?: ReactNode
  hint?: ReactNode
}

export function Field({ label, as = 'input', options, error, hint, ...props }: FieldProps) {
  const a11y = { 'aria-invalid': error ? true : undefined }
  let control
  if (as === 'textarea') control = <textarea className="field__control" {...a11y} {...props} />
  else if (as === 'select')
    control = (
      <select className="field__control" {...a11y} {...props}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    )
  else control = <input className="field__control" {...a11y} {...props} />
  return (
    <label className={`field ${error ? 'field--error' : ''}`}>
      <span className="field__label">
        {label}
        {props.required && <span className="field__req"> *</span>}
      </span>
      {control}
      {error ? <span className="field__error">{error}</span> : hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      onClick={() => onChange(!checked)}
    />
  )
}

export function ToggleRow({
  title,
  subtitle,
  checked,
  onChange,
}: {
  title: string
  subtitle?: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="toggle-row">
      <div className="toggle-row__text">
        <p className="toggle-row__title">{title}</p>
        <p className="toggle-row__sub">{subtitle}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  )
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress__bar" style={{ width: `${value}%` }} />
    </div>
  )
}

/**
 * Foto berbingkai. `src` = foto statis (impor), atau `url` = berkas dari backend
 * (`video` = tampilkan pemutar video tanpa suara).
 */
export function Photo({
  src,
  url,
  video,
  width,
  height,
  alt = '',
  letterbox,
  radius,
}: {
  src?: StaticImageData
  url?: string
  video?: boolean
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  alt?: string
  letterbox?: boolean
  radius?: CSSProperties['borderRadius']
}) {
  return (
    <div
      className={`photo ${letterbox ? 'photo--letterbox' : ''}`}
      style={{ width, height, borderRadius: radius }}
    >
      {url && video ? (
        <video className="photo__video" src={url} muted playsInline preload="metadata" aria-label={alt} />
      ) : url ? (
        <Image src={url} alt={alt} fill unoptimized sizes="(max-width: 768px) 100vw, 480px" />
      ) : (
        <Image src={src} alt={alt} sizes="(max-width: 768px) 100vw, 480px" />
      )}
    </div>
  )
}

export function PageFooter() {
  return (
    <footer className="page-footer">
      <p>© 2026 TKBJ • Disbudpar Provinsi Jawa Timur</p>
      <p>Seluruh angka dan aktivitas merupakan data contoh.</p>
    </footer>
  )
}
