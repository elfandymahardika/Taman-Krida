'use client'

import { useState } from 'react'
import { Badge, Card, DetailRow, Field, Note } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { wibDateTime } from '@/data/format'
import { mutate } from '@/lib/api'
import { applicationStatus } from './permohonankomunitas'

/** Tinjau satu permohonan: setujui atau tolak dengan catatan admin. */
export default function TinjauPendaftar({ application: selected }: { application: any }) {
  const overlay = useOverlay()
  const [note, setNote] = useState(selected.adminNote ?? '')
  const [busy, setBusy] = useState(false)
  const canDecide = selected.status === 'Menunggu persetujuan' && !busy

  const decide = async (action: string, message: string) => {
    setBusy(true)
    try {
      await mutate(`/communities/${selected.id}/${action}`, { method: 'POST', body: { note } })
      overlay.toast(message)
    } catch (err) {
      overlay.toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Tinjau profil pendaftar" subtitle={`${selected.name} · Diajukan ${wibDateTime(selected.appliedAt)}`}>
      <div>
        <Badge>{applicationStatus(selected)}</Badge>
      </div>
      <div>
        <DetailRow label="Kategori">{selected.category}</DetailRow>
        <DetailRow label="Ketua">{selected.leader}</DetailRow>
        <DetailRow label="Domisili">{selected.city}</DetailRow>
        <DetailRow label="Keanggotaan">{selected.members} anggota aktif</DetailRow>
        <DetailRow label="Kontak WhatsApp">{selected.contact}</DetailRow>
        <DetailRow label="Riwayat">{selected.since}</DetailRow>
      </div>
      <Note>Profil yang disetujui langsung tampil di direktori aplikasi publik.</Note>
      <Field
        label="Catatan admin"
        as="textarea"
        placeholder="Mis. mohon lampirkan foto kegiatan terbaru"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={selected.status !== 'Menunggu persetujuan'}
      />
      <div className="btn-row">
        <button className="btn btn--primary" disabled={!canDecide} onClick={() => decide('approve', 'Komunitas disetujui dan tampil di direktori')}>
          Setujui &amp; tampilkan
        </button>
        <button className="btn" disabled={!canDecide} onClick={() => decide('reject', 'Pendaftaran ditolak — catatan admin terkirim')}>
          Tolak
        </button>
      </div>
    </Card>
  )
}
