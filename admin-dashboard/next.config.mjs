/** @type {import('next').NextConfig} */
const nextConfig = {
  // Kunci root proyek ke folder ini (ada package-lock.json lain di folder induk).
  turbopack: { root: import.meta.dirname },
}

export default nextConfig
