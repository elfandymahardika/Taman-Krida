import type { Metadata } from 'next'
import { getCurrentUser, getNotes } from '@/lib/dal'
import Catatan from './components/catatan'

export const metadata: Metadata = { title: 'Catatan staf' }

/** Server Component: data diambil lewat DAL; setelah mutasi, revalidatePath('/catatan') merender ulang halaman ini. */
export default async function Page({ searchParams }: PageProps<'/catatan'>) {
  const user = await getCurrentUser()
  const isAdmin = user.roleKey === 'admin'
  // Mode supervisi (semua staf) hanya untuk Administrator utama; backend juga menolaknya untuk peran lain.
  const all = isAdmin && (await searchParams).lingkup === 'semua'
  const notes = await getNotes({ all })
  return <Catatan notes={notes} userId={user.id} isAdmin={isAdmin} all={all} />
}
