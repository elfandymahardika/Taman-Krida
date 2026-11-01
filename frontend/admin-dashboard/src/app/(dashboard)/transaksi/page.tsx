import type { Metadata } from 'next'
import Transaksi from './components/transaksi'

export const metadata: Metadata = { title: 'Transaksi & pembayaran' }

export default function Page() {
  return <Transaksi />
}
