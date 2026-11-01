import type { Metadata } from 'next'
import Pengguna from './components/pengguna'

export const metadata: Metadata = { title: 'Pengguna & peran admin' }

export default function Page() {
  return <Pengguna />
}
