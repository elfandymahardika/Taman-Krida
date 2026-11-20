/**
 * Header keamanan untuk semua respons Next.js (halaman, Route Handler /api/be & /uploads, aset).
 * - X-Content-Type-Options: nosniff → browser tidak menebak tipe berkas selain Content-Type-nya.
 * - X-Frame-Options: DENY → panel tidak bisa dimuat di iframe situs lain (mencegah clickjacking).
 * - Referrer-Policy & Permissions-Policy → tidak membocorkan URL lengkap ke situs lain, kamera/mikrofon/lokasi dimatikan.
 * `serverActions.allowedOrigins` sengaja tidak diatur: Ngrok meneruskan host aslinya, jadi tidak diperlukan.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Kunci root proyek ke folder ini (ada package-lock.json lain di folder induk).
  turbopack: { root: import.meta.dirname },
  // Docker: `next build` menghasilkan .next/standalone (server.js + node_modules minimum) sehingga image produksi
  // tidak perlu `npm install` dan jauh lebih kecil. Lihat Dockerfile.
  output: 'standalone',
  poweredByHeader: false,
  images: {
    // Hanya path ini yang boleh dioptimasi <Image/> (tanpa query string): logo di public/assets dan foto galeri
    // unggahan admin (/uploads/...). Foto unggahan bisa sampai puluhan MB; dioptimasi jadi WebP/AVIF seukuran
    // kartu (lihat `sizes` di komponen Photo) sehingga LCP & data yang diunduh jauh lebih kecil.
    localPatterns: [
      { pathname: '/assets/**', search: '' },
      { pathname: '/uploads/**', search: '' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    agentUpgrade: 'security',
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Pratinjau PDF di menu Dokumen memuat /uploads/... lewat iframe dari domain sendiri.
      // Aturan yang lebih akhir menimpa header yang sama, jadi hanya path ini yang boleh di-iframe (oleh origin sendiri).
      { source: '/uploads/:path*', headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
    ]
  },
}

export default nextConfig
