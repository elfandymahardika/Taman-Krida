import type { Metadata } from 'next'
import Profil from './components/profil'

export const metadata: Metadata = { title: 'Profil & denah' }

export default function Page() {
  return <Profil />
}
