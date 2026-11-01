'use client'

import { useRouter } from 'next/navigation'
import { PageHeader, Tabs } from '@/components/ui'

const SCOPES = ['Catatan saya', 'Semua staf'] as const

/** Judul halaman; Administrator utama bisa beralih ke mode supervisi semua catatan staf. */
export default function Hero({ isAdmin, all }: { isAdmin: boolean; all: boolean }) {
  const router = useRouter()
  return (
    <>
      <PageHeader
        title="Catatan staf"
        subtitle={
          isAdmin
            ? 'Catatan kerja pribadi tiap staf. Sebagai Administrator utama Anda dapat melihat, mengubah, dan mengarsipkan catatan semua staf.'
            : 'Catatan kerja pribadi Anda. Hanya Anda (dan Administrator utama) yang dapat melihatnya.'
        }
      />
      {isAdmin && (
        <Tabs
          items={SCOPES}
          value={all ? 'Semua staf' : 'Catatan saya'}
          onChange={(v) => router.push(v === 'Semua staf' ? '/catatan?lingkup=semua' : '/catatan')}
        />
      )}
    </>
  )
}
