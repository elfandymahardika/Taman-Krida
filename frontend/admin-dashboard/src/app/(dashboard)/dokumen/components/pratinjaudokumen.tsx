'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { ExternalLink, X } from 'lucide-react'
import { assetUrl } from '@/lib/api'
import { isImage, isPdf } from './jenisdokumen'
import type { DocumentItem } from './jenisdokumen'

/** Modal pratinjau: gambar ditampilkan langsung, PDF dibaca lewat iframe tanpa pindah tab. */
export default function PratinjauDokumen({ doc, onClose }: { doc: DocumentItem | null; onClose: () => void }) {
  useEffect(() => {
    if (!doc) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [doc, onClose])

  if (!doc) return null
  const url = assetUrl(doc.url)

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="preview" role="dialog" aria-modal="true" aria-label={`Pratinjau ${doc.name}`}>
        <div className="preview__head">
          <div className="preview__title">
            <h2 title={doc.name}>{doc.name}</h2>
            <p className="muted">{doc.fileType}</p>
          </div>
          <a className="modal__close" href={url} target="_blank" rel="noopener noreferrer" aria-label="Buka di tab baru">
            <ExternalLink size={16} strokeWidth={1.75} />
          </a>
          <button className="modal__close" onClick={onClose} aria-label="Tutup">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        <div className="preview__body">
          {/* unoptimized: berkas unggahan disajikan apa adanya dari backend. */}
          {isImage(doc) && <Image src={url} alt={doc.name} width={1600} height={1200} unoptimized className="preview__image" />}
          {isPdf(doc) && <iframe src={url} title={doc.name} className="preview__pdf" />}
        </div>
      </div>
    </div>
  )
}
