'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Search } from 'lucide-react'
import { useQuery } from '../../lib/api'
import { useDismiss } from './popover'

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** Pencarian global: GET /api/search?q=… dengan dropdown hasil & navigasi keyboard. */
export default function Pencarian() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const close = useCallback(() => setOpen(false), [])
  const ref = useDismiss(open, close)
  const q = useDebounced(query.trim(), 250)
  const { data, refreshing } = useQuery(q.length >= 2 ? `/search?q=${encodeURIComponent(q)}` : null)
  const results = q.length >= 2 ? (data?.results ?? []) : []

  const go = (r) => {
    setOpen(false)
    setQuery('')
    router.push(r.href)
  }

  return (
    <div className="search-pop" ref={ref}>
      <form
        className="global-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          if (results[cursor]) go(results[cursor])
        }}
      >
        <Search strokeWidth={1.75} />
        <input
          type="search"
          aria-label="Pencarian global"
          aria-expanded={open && q.length >= 2}
          aria-controls="search-results"
          placeholder="Cari acara, transaksi, sewa, komunitas..."
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setCursor(0)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setCursor((c) => Math.min(c + 1, results.length - 1))
            else if (e.key === 'ArrowUp') setCursor((c) => Math.max(c - 1, 0))
            else return
            e.preventDefault()
          }}
        />
        {refreshing && <Loader2 className="spin" strokeWidth={1.75} />}
      </form>
      {open && q.length >= 2 && (
        <div className="popover search-pop__panel" id="search-results" role="listbox" aria-label="Hasil pencarian">
          {results.length ? (
            results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}`}
                role="option"
                aria-selected={i === cursor}
                className={`search-hit ${i === cursor ? 'is-active' : ''}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r)}
              >
                <span className="search-hit__type">{r.type}</span>
                <span className="search-hit__text">
                  <strong>{r.title}</strong>
                  <span>{r.sub}</span>
                </span>
              </button>
            ))
          ) : (
            <p className="popover__empty">{data ? `Tidak ada hasil untuk "${q}".` : 'Mencari…'}</p>
          )}
        </div>
      )}
    </div>
  )
}
