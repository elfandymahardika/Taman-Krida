'use client'

import { useState } from 'react'
import { ErrorBanner, PageFooter } from '@/components/ui'
import { useEvents } from '@/data/events'
import { invalidate, useQuery } from '@/lib/api'
import { useAccess } from '@/lib/access'
import Hero from './hero'
import Ringkasan from './ringkasan'
import GrafikPenjualan from './grafikpenjualan'
import AgendaTerdekat from './agendaterdekat'
import TugasAdmin from './tugasadmin'
import TransaksiTerbaru from './transaksiterbaru'
import AktivitasTerbaru from './aktivitasterbaru'

/** Ringkasan, transaksi, dan log aktivitas dimuat ulang otomatis selama tab terbuka. */
const REFRESH_MS = 30000

export default function Dashboard() {
  const events = useEvents()
  const [period, setPeriod] = useState<string | null>(null)
  const summaryQ = useQuery(period ? `/dashboard/summary?period=${period}` : '/dashboard/summary', { refreshInterval: REFRESH_MS })
  const s = summaryQ.data
  // Grafik keuangan & transaksi hanya untuk peran yang boleh melihat modul Transaksi.
  const seesPayments = useAccess().canView('payments')

  return (
    <>
      <Hero refreshing={summaryQ.refreshing} />
      <ErrorBanner error={summaryQ.error} onRetry={invalidate} />
      <Ringkasan summary={s} onPeriod={setPeriod} />

      {seesPayments && <GrafikPenjualan />}

      <div className="split split--stretch">
        <AgendaTerdekat events={events} today={s?.today ?? '2026-10-02'} />
        <TugasAdmin summary={s} />
      </div>

      {seesPayments ? (
        <div className="split split--stretch">
          <TransaksiTerbaru />
          <AktivitasTerbaru />
        </div>
      ) : (
        <AktivitasTerbaru />
      )}

      <PageFooter />
    </>
  )
}
