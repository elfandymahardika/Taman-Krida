'use client'

import { useRef, useState } from 'react'
import { ExternalLink, Trash2, Upload } from 'lucide-react'
import { Card } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { assetUrl } from '@/lib/api'
import { VIDEO_MAX_MB, cultureForm, cultureStore, validateVideoFile } from './materi'
import type { Culture } from './materi'

/** Panel video materi terpilih: pratinjau, unggah/ganti berkas (dengan progres), atau hapus. */
export default function VideoMateri({ topic, canEdit }: { topic: Culture; canEdit: boolean }) {
  const overlay = useOverlay()
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const video = topic.video

  const onFile = async (file?: File) => {
    if (input.current) input.current.value = ''
    if (!file) return
    const invalid = validateVideoFile(file)
    if (invalid) return overlay.toast(invalid, 'error')
    setProgress(0)
    try {
      await cultureStore.uploadVideo(topic.id, file, setProgress)
      overlay.toast('Video materi diunggah')
    } catch (err) {
      overlay.toast((err as Error).message, 'error')
    } finally {
      setProgress(null)
    }
  }

  const remove = () =>
    overlay.showDetail({
      title: 'Hapus video?',
      subtitle: topic.title,
      rows: [
        ['Video', video?.kind === 'file' ? 'Berkas unggahan (ikut dihapus dari penyimpanan)' : video?.url],
        ['Catatan', 'Tab Foto / Video di aplikasi tidak lagi menampilkan video.'],
      ],
      primaryLabel: 'Hapus',
      success: 'Video materi dihapus',
      onPrimary: () => cultureStore.removeVideo(topic.id),
    })

  return (
    <Card
      title={`Video materi · ${topic.title}`}
      subtitle={
        video?.kind === 'file'
          ? 'Berkas video diputar langsung di tab Foto / Video aplikasi.'
          : video
            ? 'Tautan dibuka di aplikasi YouTube atau browser ponsel pengunjung.'
            : 'Belum ada video. Tambahkan tautan YouTube lewat Edit, atau unggah berkas MP4/WEBM/MOV.'
      }
      action={
        canEdit && (
          <div className="btn-row">
            <input
              ref={input}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              hidden
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <button className="btn" disabled={progress !== null} onClick={() => input.current?.click()} title={`Maks. ${VIDEO_MAX_MB} MB`}>
              <Upload strokeWidth={1.75} /> {progress !== null ? `Mengunggah ${progress}%` : video?.kind === 'file' ? 'Ganti berkas' : 'Unggah berkas'}
            </button>
            <button className="btn" onClick={() => overlay.showForm(cultureForm(topic))}>
              <ExternalLink strokeWidth={1.75} /> Pakai tautan
            </button>
            {video && (
              <button className="btn btn--danger" onClick={remove}>
                <Trash2 strokeWidth={1.75} /> Hapus
              </button>
            )}
          </div>
        )
      }
    >
      {video?.kind === 'file' && (
        <video className="edu-video" src={assetUrl(video.url)} controls preload="metadata" aria-label={`Video ${topic.title}`} />
      )}
      {video?.kind === 'link' && (
        <a className="link" href={video.url} target="_blank" rel="noreferrer noopener">
          {video.url} ↗
        </a>
      )}
    </Card>
  )
}
