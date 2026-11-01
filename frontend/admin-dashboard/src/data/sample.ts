// Aset foto & tautan berkas publik. Data acara, transaksi, sewa, dan komunitas kini dari backend.

import type { StaticImageData } from 'next/image'
import ketoprak from '../assets/foto-ketoprak.png'
import topeng from '../assets/foto-topeng.png'
import wayang from '../assets/foto-wayang.png'

// Berkas di public/ disajikan Next.js dari root situs.
export const asset = (path: string) => `/assets/${path}`

// Impor statis: next/image otomatis tahu ukuran asli foto dan mengoptimalkannya.
export const PHOTOS: Record<'wayang' | 'topeng' | 'ketoprak', { src: StaticImageData; letterbox?: boolean }> = {
  wayang: { src: wayang, letterbox: true },
  topeng: { src: topeng },
  ketoprak: { src: ketoprak },
}

export type PhotoKey = keyof typeof PHOTOS