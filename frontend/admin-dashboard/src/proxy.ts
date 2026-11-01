import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE } from './lib/cookie'

/**
 * Pagar kasar: halaman panel tanpa cookie sesi langsung dialihkan ke /login sebelum dirender.
 * Keabsahan sesi (token belum dicabut, akun masih aktif) dicek di DAL (lib/dal.ts), bukan di sini.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next()

  const { pathname, search } = request.nextUrl
  const loginUrl = new URL('/login', request.url)
  if (pathname !== '/') loginUrl.searchParams.set('from', pathname + search)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Semua halaman kecuali login/daftar, proxy API, berkas unggahan, aset Next.js, dan file statis (berekstensi).
  matcher: ['/((?!login|register|api/|uploads/|_next/static|_next/image|.*\\..*).*)'],
}
