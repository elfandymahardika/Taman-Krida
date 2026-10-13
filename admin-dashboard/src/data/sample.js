// Data contoh sesuai desain Figma. Seluruh angka bersifat ilustratif.

import ketoprak from '../assets/foto-ketoprak.png'
import topeng from '../assets/foto-topeng.png'
import wayang from '../assets/foto-wayang.png'

// Berkas di public/ disajikan Next.js dari root situs.
export const asset = (path) => `/assets/${path}`

// Impor statis: next/image otomatis tahu ukuran asli foto dan mengoptimalkannya.
export const PHOTOS = {
  wayang: { src: wayang, letterbox: true },
  topeng: { src: topeng },
  ketoprak: { src: ketoprak },
}

export const ORDERS = [
  { id: 'TK-1026-0128', name: 'Rina Wulandari', type: 'Tiket', service: 'Wayang Kulit', detail: '2 tiket · 2 Okt 2026', amount: 'Rp100.000', payment: 'Lunas' },
  { id: 'SG-1026-0018', name: 'Sanggar Mekar Sari', type: 'Sewa gedung', service: 'Pendopo Agung TKBJ', detail: 'Sewa · 10 Okt 2026', amount: 'Rp2.500.000', payment: 'Perlu verifikasi' },
  { id: 'TK-1026-0127', name: 'Budi Santoso', type: 'Tiket', service: 'Tari Topeng Malangan', detail: '4 tiket · 3 Okt 2026', amount: 'Rp200.000', payment: 'Perlu verifikasi' },
  { id: 'SG-1026-0017', name: 'Komunitas Ruang Seni', type: 'Sewa gedung', service: 'Gedung Kesenian & Galeri', detail: 'Sewa · 11 Okt 2026', amount: 'Rp1.500.000', payment: 'Menunggu bayar' },
  { id: 'TK-1026-0126', name: 'Dewi Lestari', type: 'Tiket', service: 'Ketoprak Guyub Rukun', detail: '3 tiket · 4 Okt 2026', amount: 'Rp150.000', payment: 'Lunas' },
]