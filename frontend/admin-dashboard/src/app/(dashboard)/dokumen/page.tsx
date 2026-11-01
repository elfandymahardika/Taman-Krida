import type { Metadata } from 'next'
import Dokumen from './components/dokumen'

export const metadata: Metadata = { title: 'Dokumen' }

export default function Page() {
  return <Dokumen />
}
