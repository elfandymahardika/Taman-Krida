'use client'

import Link from 'next/link'
import { Building2, Clock3, ReceiptText, UserPlus, Users } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { wibDateTime } from '@/data/format'

const TASKS = {
  payments: { icon: ReceiptText, title: 'Verifikasi pembayaran', sub: 'Bukti transfer tiket & sewa', action: 'Verifikasi →', to: '/transaksi' },
  rentals: { icon: Building2, title: 'Tinjau sewa gedung', sub: 'Konfirmasi jadwal & fasilitas', action: 'Tinjau →', to: '/sewa' },
  communities: { icon: Users, title: 'Persetujuan komunitas', sub: 'Pendaftaran direktori baru', action: 'Tinjau →', to: '/komunitas' },
  staff: { icon: UserPlus, title: 'Pendaftaran staf', sub: 'Akun baru menunggu persetujuan', action: 'Tinjau →', to: '/pengguna' },
}

/** Antrean tugas admin: pembayaran, sewa, komunitas, dan pendaftaran staf (disaring server per peran). */
export default function TugasAdmin({ summary }: { summary: any }) {
  const tasks = summary?.tasks ?? []
  const done = summary && !summary.tasksTotal
  return (
    <Card
      title="Perlu ditindaklanjuti"
      action={<span className={`count-pill ${done ? 'count-pill--done' : ''}`}>{summary ? summary.tasksTotal : '…'}</span>}
      style={{ gap: 19 }}
    >
      <p className="muted" style={{ fontSize: 12, marginTop: -2 }}>
        {done ? 'Semua antrean sudah ditangani. Kerja bagus!' : 'Prioritaskan permintaan yang menunggu admin.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {tasks.map((t) => {
          const meta = TASKS[t.key]
          return (
            <Link className="task task--link" key={t.key} href={meta.to}>
              <div className="task__row">
                <span className="task__icon">
                  <meta.icon strokeWidth={1.75} />
                </span>
                <div className="task__info">
                  <p className="task__title">
                    {meta.title} <span className={`task__count ${t.count ? '' : 'is-zero'}`}>{t.count}</span>
                  </p>
                  <p className="task__sub">{t.oldestAt ? `${meta.sub} · terlama ${wibDateTime(t.oldestAt)}` : meta.sub}</p>
                </div>
                {t.count ? <span className="link link--sm">{meta.action}</span> : <Badge tone="success">Beres</Badge>}
              </div>
              <div className="divider" />
            </Link>
          )
        })}
      </div>
      <p className="queue-note">
        <Clock3 strokeWidth={1.75} />
        {summary?.oldestPendingAt ? `Permintaan terlama: ${wibDateTime(summary.oldestPendingAt)}` : 'Tidak ada permintaan menunggu'}
        {summary?.waitingPayments ? ` · ${summary.waitingPayments} tagihan belum dibayar` : ''}
      </p>
    </Card>
  )
}
