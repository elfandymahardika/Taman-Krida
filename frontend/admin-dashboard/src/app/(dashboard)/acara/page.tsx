import type { Metadata } from 'next'
import Acara from './components/acara'

export const metadata: Metadata = { title: 'Acara & kalender' }

export default function Page() {
  return <Acara />
}
