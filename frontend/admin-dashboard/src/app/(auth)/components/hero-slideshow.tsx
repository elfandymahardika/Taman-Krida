'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { PHOTOS } from '@/data/sample'

const SLIDES = [PHOTOS.topeng, PHOTOS.wayang, PHOTOS.ketoprak]

/** Jeda antar-foto latar (milidetik). */
const INTERVAL_MS = 5000

/** Foto latar panel login yang berganti otomatis dengan efek memudar. */
export default function HeroSlideshow() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    // Hormati preferensi "kurangi gerakan" di sistem operasi pengguna.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length)
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="login__slides" aria-hidden="true">
      {SLIDES.map((photo, i) => (
        <Image
          key={i}
          className={[
            'login__photo',
            photo.letterbox ? 'login__photo--letterbox' : '',
            i === active ? 'is-active' : '',
          ].join(' ')}
          src={photo.src}
          alt=""
          fill
          sizes="50vw"
          preload={i === 0}
        />
      ))}
    </div>
  )
}
