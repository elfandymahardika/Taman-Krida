import type { Metadata } from 'next'
import Galeri from './components/galeri'

export const metadata: Metadata = { title: 'Virtual galeri' }

export default function Page() {
  return <Galeri />
}
