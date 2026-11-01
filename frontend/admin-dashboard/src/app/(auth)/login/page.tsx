import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOptionalUser } from '@/lib/dal'
import Login from './components/login'

export const metadata: Metadata = { title: 'Login' }

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  // Halaman asal dikirim lewat ?from=/acara. Hanya path internal yang diterima.
  const fromParam = (await searchParams).from
  const from = typeof fromParam === 'string' && fromParam.startsWith('/') && !fromParam.startsWith('//') ? fromParam : '/'

  // Sesi masih sah (dicek ke backend lewat DAL) → langsung ke halaman asal.
  if (await getOptionalUser()) redirect(from)

  return <Login from={from} />
}
