import type { NextRequest } from 'next/server'
import { BACKEND_API_URL, forwardToBackend } from '@/lib/backend'

/**
 * Proxy API untuk komponen di browser: /api/be/<path> → <backend>/api/<path>.
 * Cookie sesi (HttpOnly) diubah menjadi header Authorization di server, jadi token tidak pernah terlihat oleh JavaScript.
 */
async function handler(req: NextRequest, ctx: RouteContext<'/api/be/[...path]'>) {
  const { path } = await ctx.params
  const target = `${BACKEND_API_URL}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`
  return forwardToBackend(req, target)
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE }
