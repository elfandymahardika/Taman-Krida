'use client'

import { Badge, Card, Progress } from '@/components/ui'
import { formatBytes } from '@/data/format'
import type { Upload } from './unggahmedia'

/** Progres unggahan berkas ke server. */
export default function UnggahanMedia({ uploads, onDismiss }: { uploads: Upload[]; onDismiss: (key: string) => void }) {
  return (
    <Card title="Pengelolaan unggahan" subtitle="Progres unggahan berkas ke server. Media baru tersimpan sebagai draf.">
      {uploads.length ? (
        uploads.map((u) => (
          <div className="upload" key={u.key}>
            <div className="upload__info">
              <p>
                {u.name} <span className="muted">· {formatBytes(u.size)}</span>
              </p>
              <Progress value={u.progress} />
              <p className="muted" style={{ fontSize: 10 }}>
                {u.state === 'error' ? u.error : u.state === 'done' ? 'Selesai · tersimpan sebagai draf' : `${u.progress}% terunggah`}
              </p>
            </div>
            <Badge tone={u.state === 'done' ? 'success' : u.state === 'error' ? 'primary' : 'warning'}>
              {u.state === 'done' ? 'Selesai' : u.state === 'error' ? 'Gagal' : 'Diunggah'}
            </Badge>
            <button className="btn" onClick={() => (u.state === 'uploading' ? u.abort() : onDismiss(u.key))}>
              {u.state === 'uploading' ? 'Batal' : 'Tutup'}
            </button>
          </div>
        ))
      ) : (
        <p className="muted">Tidak ada unggahan. Klik “Unggah media” untuk menambah foto atau video.</p>
      )}
    </Card>
  )
}
