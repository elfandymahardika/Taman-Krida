'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Rute yang tidak dikenal dialihkan ke Dashboard. */
export default function NotFound() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/')
  }, [router])
  return null
}
