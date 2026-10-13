'use client'

import Image from 'next/image'
import { ChevronDown, Info, Search } from 'lucide-react'

/* Warna status mengikuti desain: hijau = selesai/aktif, kuning = perlu tindakan,
   merah marun = sorotan, abu = menunggu/draf. */
const TONES = {
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

export function Badge({ children, tone }) {
  const t = tone ?? TONES[children] ?? 'neutral'
  return <span className={`badge badge--${t}`}>{children}</span>
}

export function PageHeader({ title, subtitle, actions }) {
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

export const DATA_STAMP = 'Data contoh per Jumat, 2 Oktober 2026 · 09.30 WIB'

export function Period({ label = 'Oktober 2026', children }) {
  return (
    <div className="period">
      <div className="period__label">
        {label}
        {children}
      </div>
      <p className="period__stamp">{DATA_STAMP}</p>
    </div>
  )
}

export function Metric({ label, icon: Icon, value, hint }) {
  return (
    <div className="metric">
      <div className="metric__label">
        {label}
        {Icon && <Icon strokeWidth={1.75} />}
      </div>
      <p className="metric__value">{value}</p>
      <p className="metric__hint">{hint}</p>
    </div>
  )
}

export function Metrics({ items }) {
  return (
    <div className="metrics">
      {items.map((m) => (
        <Metric key={m.label} {...m} />
      ))}
    </div>
  )
}

export function SectionHead({ title, subtitle, action }) {
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

export function Card({ title, subtitle, action, children, className = '', style }) {
  return (
    <section className={`card ${className}`} style={style}>
      {title && <SectionHead title={title} subtitle={subtitle} action={action} />}
      {children}
    </section>
  )
}

export function SearchField({ placeholder, value, onChange }) {
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

export function Select({ value, onChange, options, label }) {
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

export function Filters({ search, selects = [] }) {
  return (
    <div className="filters">
      <SearchField {...search} />
      {selects.map((s, i) => (
        <Select key={i} {...s} />
      ))}
    </div>
  )
}

export function Tabs({ items, value, onChange, size }) {
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
export function Cell({ main, sub, size }) {
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
export function DataTable({ columns, rows, onRowClick, selected, getKey, footer }) {
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
export function TableFoot({ children, page = 0, pages = 1, onPage }) {
  return (
    <div className="table__foot">
      <p>{children}</p>
      {onPage && (
        <div className="pager">
          <button aria-label="Halaman sebelumnya" disabled={page === 0} onClick={() => onPage(page - 1)}>
            ‹
          </button>
          <span>{page + 1}</span>
          <button aria-label="Halaman berikutnya" onClick={() => onPage(page + 1 < pages ? page + 1 : page)}>
            ›
          </button>
        </div>
      )}
    </div>
  )
}

export function DetailRow({ label, children }) {
  return (
    <div className="detail-row">
      <p className="detail-row__label">{label}</p>
      <div className="detail-row__value">{children}</div>
    </div>
  )
}

export function Note({ children, tone }) {
  return (
    <div className={`note ${tone === 'info' ? 'note--info' : ''}`}>
      <Info strokeWidth={1.75} />
      <p>{children}</p>
    </div>
  )
}

export function Field({ label, as = 'input', options, error, hint, ...props }) {
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

export function Switch({ checked, onChange, label }) {
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

export function ToggleRow({ title, subtitle, checked, onChange }) {
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

export function Progress({ value }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress__bar" style={{ width: `${value}%` }} />
    </div>
  )
}

export function Photo({ src, width, height, alt = '', letterbox, radius }) {
  return (
    <div
      className={`photo ${letterbox ? 'photo--letterbox' : ''}`}
      style={{ width, height, borderRadius: radius }}
    >
      <Image src={src} alt={alt} sizes="(max-width: 768px) 100vw, 480px" />
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
