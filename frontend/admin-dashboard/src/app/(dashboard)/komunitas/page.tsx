import type { Metadata } from 'next'
import Komunitas from './components/komunitas'

export const metadata: Metadata = { title: 'Direktori komunitas' }

export default function Page() {
  return <Komunitas />
}
