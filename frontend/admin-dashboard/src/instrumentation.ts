import type { Instrumentation } from 'next'

/** Path tanpa query string: query bisa berisi kata kunci pencarian atau data pribadi. */
const pathOf = (path: string) => path.split('?')[0]

/**
 * Pelaporan error server Next.js (Server Component, Route Handler, Server Action, proxy).
 * Dicatat sebagai satu baris JSON di log server Next.js. `digest` sama dengan kode yang tampil
 * di halaman error (components/layout/terjadikesalahan.tsx), jadi laporan pengguna bisa dicocokkan dengan log ini.
 *
 * Yang dicatat secukupnya saja: pesan, digest, method, path, dan rute. Header (Cookie berisi token sesi,
 * Authorization) dan query string TIDAK dicatat.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const err = error instanceof Error ? error : new Error(String(error))
  const digest = typeof error === 'object' && error !== null && 'digest' in error ? String(error.digest) : undefined

  console.error(
    JSON.stringify({
      level: 'error',
      time: new Date().toISOString(),
      msg: 'Error server Next.js',
      digest,
      error: { name: err.name, message: err.message, stack: err.stack },
      request: { method: request.method, path: pathOf(request.path) },
      route: { path: context.routePath, type: context.routeType },
    }),
  )
}
