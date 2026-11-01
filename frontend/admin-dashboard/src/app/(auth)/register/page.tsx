import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOptionalUser } from '@/lib/dal'
import Register from './components/register'

export const metadata: Metadata = { title: 'Daftar akun' }

export default async function RegisterPage() {
  // Pengguna yang sudah login langsung diarahkan ke Dashboard.
  if (await getOptionalUser()) redirect('/')
  return <Register />
}
