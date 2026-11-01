import type { Metadata } from 'next'
import Pengaturan from './components/pengaturan'

export const metadata: Metadata = { title: 'Pengaturan' }

export default function Page() {
  return <Pengaturan />
}
