import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Unit test frontend (Vitest + React Testing Library), lihat folder tests/.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Alias `@/*` dari tsconfig.json.
    tsconfigPaths: true,
    // Paket `server-only` melempar error bila diimpor di luar Server Component; di test cukup modul kosong.
    alias: { 'server-only': fileURLToPath(new URL('./tests/server-only.ts', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})
