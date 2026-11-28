import type { Metadata } from 'next'
import Edukasi from './components/edukasi'

export const metadata: Metadata = { title: 'Edukasi Budaya' }

export default function Page() {
  return <Edukasi />
}
