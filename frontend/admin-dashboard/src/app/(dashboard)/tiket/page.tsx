import type { Metadata } from 'next'
import Tiket from './components/tiket'

export const metadata: Metadata = { title: 'Tiket pertunjukan' }

export default function Page() {
  return <Tiket />
}
