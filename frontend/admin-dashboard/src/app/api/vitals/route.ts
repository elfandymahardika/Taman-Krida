import { z } from 'zod'

/** Batas ukuran laporan; satu metrik hanya ±200 byte. */
const MAX_BYTES = 2048

const VitalSchema = z.object({
  name: z.enum(['LCP', 'INP', 'CLS', 'FCP', 'TTFB']),
  value: z.number().finite().nonnegative(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  id: z.string().max(100),
  navigationType: z.string().max(40).optional(),
  // Hanya path (tanpa query string), dibatasi agar log tetap rapi.
  path: z
    .string()
    .max(200)
    .transform((p) => p.split('?')[0]),
})

/**
 * Menerima laporan Core Web Vitals dari browser (components/webvitals.tsx) dan mencatatnya sebagai satu baris JSON
 * di log server Next.js, format yang sama dengan instrumentation.ts. Nilai "poor" dicatat sebagai `warn` agar mudah
 * dicari, mis. `docker compose logs dashboard | grep web-vitals`.
 */
export async function POST(req: Request) {
  const text = await req.text()
  if (text.length > MAX_BYTES) return new Response(null, { status: 413 })

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return new Response(null, { status: 400 })
  }
  const parsed = VitalSchema.safeParse(json)
  if (!parsed.success) return new Response(null, { status: 400 })

  const v = parsed.data
  const line = JSON.stringify({
    level: v.rating === 'poor' ? 'warn' : 'info',
    time: new Date().toISOString(),
    msg: 'web-vitals',
    metric: v.name,
    value: v.name === 'CLS' ? Number(v.value.toFixed(4)) : Math.round(v.value),
    rating: v.rating,
    path: v.path,
    navigationType: v.navigationType,
    id: v.id,
  })
  if (v.rating === 'poor') console.warn(line)
  else console.info(line)
  return new Response(null, { status: 204 })
}
