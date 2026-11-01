'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useOverlay } from '../overlay'
import { relativeTime } from '../../data/format'
import { mutate, useQuery } from '../../lib/api'
import { useDismiss } from './popover'

/** Lonceng notifikasi: diperbarui tiap 30 detik, klik item untuk membuka halaman terkait. */
export default function Notifikasi() {
  const router = useRouter()
  const { toast } = useOverlay()
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const ref = useDismiss(open, close)
  const { data } = useQuery('/notifications', { refreshInterval: 30000 })
  const unread = data?.unread ?? 0

  const readAll = async () => {
    try {
      await mutate('/notifications/read-all', { method: 'POST' })
      toast('Semua notifikasi ditandai dibaca')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className="search-pop" ref={ref}>
      <button
        className="icon-btn"
        aria-label={unread ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell strokeWidth={1.75} />
        {unread > 0 && <span className="icon-btn__count">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="popover notif-panel" role="dialog" aria-label="Notifikasi">
          <div className="notif-panel__head">
            <strong>Notifikasi</strong>
            <button className="link link--sm" disabled={!unread} onClick={readAll}>
              Tandai semua dibaca
            </button>
          </div>
          {data?.items.length ? (
            data.items.map((n) => (
              <button
                key={n.id}
                className={`notif ${n.read ? '' : 'is-unread'}`}
                onClick={() => {
                  setOpen(false)
                  if (!n.read) mutate(`/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {})
                  if (n.link) router.push(n.link)
                }}
              >
                <span className="notif__dot" aria-hidden="true" />
                <span className="notif__text">
                  {n.message}
                  <small>{relativeTime(n.createdAt)}</small>
                </span>
              </button>
            ))
          ) : (
            <p className="popover__empty">{data ? 'Belum ada notifikasi.' : 'Memuat…'}</p>
          )}
        </div>
      )}
    </div>
  )
}
