import Image from 'next/image'
import { PHOTOS, asset } from '@/data/sample'

/** Panel foto & tagline di sisi kiri halaman login dan registrasi. */
export default function Hero() {
  return (
    <aside className="login__hero">
      <Image className="login__photo" src={PHOTOS.topeng.src} alt="" fill sizes="50vw" preload />
      <div className="login__hero-content">
        <div className="brand__mark">
          <Image src={asset('brand-mark.svg')} alt="" width={30} height={30} />
          <span className="brand__name" style={{ color: '#fff' }}>
            TKBJ
          </span>
        </div>
        <h2 className="login__tagline">Ruang bersama untuk seni dan budaya Jawa Timur.</h2>
        <p className="login__caption">Taman Krida Budaya Jawa Timur · Disbudpar Provinsi Jawa Timur</p>
      </div>
    </aside>
  )
}
