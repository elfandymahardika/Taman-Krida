import { Inter, Playfair_Display, Poppins } from 'next/font/google'
import { OverlayProvider } from '../components/overlay'
import '../index.css'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-playfair' })
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins' })

export const metadata = {
  title: {
    default: 'Panel Administrator TKBJ',
    template: '%s · Panel Administrator TKBJ',
  },
  description: 'Panel administrator Taman Krida Budaya Jawa Timur (prototipe, data contoh).',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${inter.variable} ${playfair.variable} ${poppins.variable}`}>
      <body>
        <OverlayProvider>{children}</OverlayProvider>
      </body>
    </html>
  )
}
