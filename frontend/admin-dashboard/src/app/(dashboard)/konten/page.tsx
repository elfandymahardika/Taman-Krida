import type { Metadata } from 'next'
import Konten from './components/konten'

export const metadata: Metadata = { title: 'Konten' }

export default function Page() {
  return <Konten />
}
