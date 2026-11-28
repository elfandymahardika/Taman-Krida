import type { Metadata } from 'next'
import Pengunjung from './components/pengunjung'

export const metadata: Metadata = { title: 'Akun pengunjung' }

export default function Page() {
  return <Pengunjung />
}
