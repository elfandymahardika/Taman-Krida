import Layout from '../../components/Layout'
import RequireAuth from '../../components/RequireAuth'

/** Semua halaman admin memakai sidebar + topbar dan hanya bisa dibuka setelah login. */
export default function AdminLayout({ children }) {
  return (
    <RequireAuth>
      <Layout>{children}</Layout>
    </RequireAuth>
  )
}
