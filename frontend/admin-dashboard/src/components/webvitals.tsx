'use client'

import { useReportWebVitals } from 'next/web-vitals'

type Metric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0]

/** Metrik yang dipantau (Core Web Vitals + dua metrik pendukung). */
const TRACKED = new Set(['LCP', 'INP', 'CLS', 'FCP', 'TTFB'])

/**
 * Kirim satu metrik ke /api/vitals (app/api/vitals/route.ts) yang mencatatnya di log server Next.js.
 * `sendBeacon` tetap terkirim walau tab ditutup (INP & CLS baru final saat halaman ditinggalkan) dan tidak
 * menahan interaksi pengguna. Fungsi ini sengaja di luar komponen agar referensinya tetap (tidak dilaporkan dobel).
 */
function report(metric: Metric) {
  if (!TRACKED.has(metric.name)) return
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    path: window.location.pathname,
  })
  if (!navigator.sendBeacon?.('/api/vitals', new Blob([body], { type: 'application/json' }))) {
    fetch('/api/vitals', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {})
  }
}

/**
 * Pemantau Core Web Vitals pengguna sungguhan (dipasang sekali di app/layout.tsx).
 * Target dashboard: LCP ≤ 2,5 dtk, INP ≤ 200 ms, CLS ≤ 0,1 (lihat docs/performa.md).
 */
export function WebVitals() {
  useReportWebVitals(report)
  return null
}
