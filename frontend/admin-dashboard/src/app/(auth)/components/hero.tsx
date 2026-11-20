import Image from 'next/image'
import { asset } from '@/data/sample'
import HeroSlideshow from './hero-slideshow'

/** Panel foto & tagline di sisi kiri halaman login dan registrasi. */
export default function Hero() {
  return (
    <aside className="login__hero">
      <HeroSlideshow />
      <div className="login__hero-content">
        <div className="login__brand">
          <Image src={asset('logo-tkbj.svg')} alt="Logo TKBJ" width={56} height={56} />
          <span className="login__brand-name">
            Taman Krida Budaya
            <small>Jawa Timur</small>
          </span>
        </div>
        <h2 className="login__tagline">Ruang bersama untuk seni dan budaya Jawa Timur.</h2>
        <p className="login__caption">Dinas Kebudayaan dan Pariwisata Provinsi Jawa Timur</p>
      </div>
    </aside>
  )
}
