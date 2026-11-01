'use client'

import { Download, Eye, FileText, Image as ImageIcon, Trash2 } from 'lucide-react'
import { formatBytes } from '@/data/format'
import { assetUrl } from '@/lib/api'
import { isImage, isPdf } from './jenisdokumen'
import type { DocumentItem } from './jenisdokumen'

const when = (iso: string) => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

/** Kartu satu dokumen: ikon jenis, nama (terpotong rapi), ukuran, tanggal, pemilik, dan aksi. */
export default function KartuDokumen({
  doc,
  showOwner,
  onPreview,
  onDelete,
}: {
  doc: DocumentItem
  showOwner: boolean
  onPreview: (doc: DocumentItem) => void
  onDelete: (doc: DocumentItem) => void
}) {
  return (
    <article className="doc-card">
      <div className="doc-card__head">
        <div className={`doc-card__icon ${isImage(doc) ? 'is-image' : 'is-pdf'}`}>
          {isImage(doc) ? <ImageIcon strokeWidth={1.75} /> : <FileText strokeWidth={1.75} />}
        </div>
        <div className="doc-card__text">
          <h3 className="doc-card__name" title={doc.name}>
            {doc.name}
          </h3>
          <p className="doc-card__meta">
            {formatBytes(doc.fileSize)} · {isPdf(doc) ? 'PDF' : 'Gambar'}
          </p>
          <p className="doc-card__meta">
            {showOwner && doc.owner && <>{doc.owner} · </>}
            {when(doc.createdAt)}
          </p>
        </div>
      </div>

      <div className="doc-card__actions">
        <button className="pill" onClick={() => onPreview(doc)}>
          <Eye strokeWidth={1.75} /> Lihat
        </button>
        <a className="pill" href={assetUrl(doc.url)} download={doc.name}>
          <Download strokeWidth={1.75} /> Unduh
        </a>
        <button className="pill pill--danger" onClick={() => onDelete(doc)}>
          <Trash2 strokeWidth={1.75} /> Hapus
        </button>
      </div>
    </article>
  )
}
