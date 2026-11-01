'use client'

import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { AlertCircle, UploadCloud } from 'lucide-react'
import { Progress } from '@/components/ui'
import { formatBytes } from '@/data/format'
import { upload } from '@/lib/api'
import { ACCEPT, ALLOWED_TYPES, MAX_FILE_SIZE } from './jenisdokumen'

/**
 * Area unggah drag & drop. Format & ukuran dicek dulu di browser (backend tetap memeriksa ulang),
 * lalu berkas dikirim sebagai FormData lewat XMLHttpRequest agar progres unggahannya nyata (0–100%).
 */
export default function AreaUnggah({ onUploaded }: { onUploaded: (name: string) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploading, setUploading] = useState<{ name: string; progress: number; abort: () => void } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndUpload = (file: File) => {
    setErrorMessage(null)
    // 1. Validasi ukuran (maks 5 MB)
    if (file.size > MAX_FILE_SIZE) return setErrorMessage(`Ukuran ${file.name} ${formatBytes(file.size)}; maksimal 5 MB.`)
    // 2. Validasi tipe berkas
    if (!ALLOWED_TYPES.includes(file.type)) return setErrorMessage('Tipe berkas tidak didukung. Pilih gambar (JPG/PNG/WEBP) atau PDF.')
    performUpload(file)
  }

  const performUpload = (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const job = upload('/upload', formData, { onProgress: (progress) => setUploading((u) => u && { ...u, progress }) })
    setUploading({ name: file.name, progress: 0, abort: job.abort })
    job.promise.then(
      () => {
        setUploading(null)
        onUploaded(file.name)
      },
      (err) => {
        setUploading(null)
        setErrorMessage(err.message)
      },
    )
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (uploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndUpload(file)
  }

  return (
    <div className="dropzone-wrap">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={Boolean(uploading)}
        className={`dropzone ${isDragging ? 'is-dragging' : ''} ${uploading ? 'is-busy' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) validateAndUpload(file)
            e.target.value = ''
          }}
        />
        <UploadCloud className="dropzone__icon" strokeWidth={1.5} />
        {uploading ? (
          <div className="dropzone__progress">
            <p className="dropzone__title">Mengunggah {uploading.name}…</p>
            <Progress value={uploading.progress} />
            <p className="muted">{uploading.progress}% terunggah</p>
            <button
              type="button"
              className="btn"
              onClick={(e) => {
                e.stopPropagation()
                uploading.abort()
              }}
            >
              Batal
            </button>
          </div>
        ) : (
          <>
            <p className="dropzone__title">Tarik &amp; lepas berkas ke sini, atau klik untuk memilih</p>
            <p className="muted">PDF, PNG, JPG, atau WEBP · maksimal 5 MB</p>
          </>
        )}
      </div>

      {errorMessage && (
        <div className="form-msg form-msg--error dropzone__error" role="alert">
          <AlertCircle strokeWidth={1.75} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
