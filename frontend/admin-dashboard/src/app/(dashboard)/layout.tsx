import type { ReactNode } from 'react'
import Layout from '../../components/layout/layout'
import { getCurrentUser } from '../../lib/dal'
import { SessionProvider } from '../../lib/session'

/**
 * Semua halaman admin memakai sidebar + topbar dan hanya bisa dibuka setelah login.
 * getCurrentUser() (DAL) memvalidasi sesi ke backend dan mengalihkan ke /login bila tidak sah;
 * profil & hak aksesnya dibagikan ke Client Component lewat SessionProvider.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { loginAt, ...user } = await getCurrentUser()
  return (
    <SessionProvider session={{ user, loginAt }}>
      <Layout>{children}</Layout>
    </SessionProvider>
  )
}
