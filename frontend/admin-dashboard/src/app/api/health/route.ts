import { BACKEND_ORIGIN } from '@/lib/backend'

/** Batas waktu memeriksa backend; health check tidak boleh ikut menggantung. */
const TIMEOUT_MS = 2000

/**
 * Health check panel admin untuk Docker HEALTHCHECK & skrip deploy (zero-downtime).
 * 200 bila server Next.js berjalan DAN API dashboard (yang juga mengecek MySQL) sehat. Versi baru yang salah
 * konfigurasi API_URL-nya akan 503 sehingga tidak pernah menerima trafik; versi lama tetap melayani.
 */
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' }
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/health`, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (res.ok) return Response.json({ ok: true, status: 'ok', service: 'tkbj-dashboard', backend: 'up' }, { headers })
    return Response.json({ ok: false, status: 'error', service: 'tkbj-dashboard', backend: `status ${res.status}` }, { status: 503, headers })
  } catch {
    return Response.json({ ok: false, status: 'error', service: 'tkbj-dashboard', backend: 'down' }, { status: 503, headers })
  }
}
