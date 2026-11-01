import type { Metadata } from 'next'
import Sewa from './components/sewa'

export const metadata: Metadata = { title: 'Sewa gedung' }

export default function Page() {
  return <Sewa />
}
