import type { NextRequest } from 'next/server'
import { BACKEND_ORIGIN, forwardToBackend } from '@/lib/backend'

/** Berkas galeri & dokumen (/uploads/<nama file>) disajikan dari backend lewat domain frontend yang sama. */
export async function GET(req: NextRequest, ctx: RouteContext<'/uploads/[...path]'>) {
  const { path } = await ctx.params
  return forwardToBackend(req, `${BACKEND_ORIGIN}/uploads/${path.map(encodeURIComponent).join('/')}`, { withAuth: false })
}
