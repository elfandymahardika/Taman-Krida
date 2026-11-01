'use client'

import { useState } from 'react'
import { Badge, Card, DetailRow, Field, Note } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { formatBytes, rupiah, shortDate, wibDateTime } from '@/data/format'
import { api, mutate, openFile } from '@/lib/api'
import { range } from './jadwalfasilitas'

/** Tinjau satu permintaan sewa: cek bentrok, berkas, lalu setujui atau tolak. */
export default function TinjauSewa({ rental: selected }: { rental: any }) {
  const overlay = useOverlay()
  const [note, setNote] = useState(selected.adminNote ?? '')
  const [busy, setBusy] = useState(false)

  const decide = async (action: string, message: string) => {
    setBusy(true)
    try {
      await mutate(`/rentals/${selected.id}/${action}`, { method: 'POST', body: { note } })
      overlay.toast(message)
    } catch (err) {
      overlay.toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  /** Dokumen dari aplikasi pengunjung (KTP, surat, proposal); pengajuan data contoh/loket tidak punya berkas. */
  const showFiles = async () => {
    let docs: { id: string; label: string; name: string; size: number; url: string }[] = []
    try {
      docs = await api(`/rentals/${selected.id}/documents`)
    } catch (err) {
      return overlay.toast(err.message, 'error')
    }
    const open = (url: string) => openFile(url).catch((err) => overlay.toast(err.message, 'error'))
    overlay.showDetail({
      title: 'Berkas Pengajuan',
      subtitle: docs.length ? 'Dokumen yang diunggah pemohon lewat aplikasi · klik untuk membuka' : 'Dokumen yang diunggah pemohon',
      rows: docs.length
        ? docs.map((d) => [
            d.label,
            <button key={d.id} className="link" onClick={() => open(d.url)}>
              {d.name} · {formatBytes(d.size)}
            </button>,
          ])
        : [
            ['Proposal kegiatan', selected.file ?? '—'],
            ['Keterangan', 'Pengajuan ini tidak diunggah lewat aplikasi, jadi berkasnya tidak tersimpan di sistem.'],
          ],
      primaryLabel: selected.filesComplete ? undefined : 'Tandai lengkap',
      cancelLabel: 'Tutup',
      success: 'Berkas ditandai lengkap',
      onPrimary: () => mutate(`/rentals/${selected.id}/files-complete`, { method: 'POST' }),
    })
  }

  return (
    <Card title="Tinjau permintaan" subtitle={`${selected.id} · Diajukan ${wibDateTime(selected.submittedAt)}`}>
      <div className="btn-row">
        <Badge>{selected.approval}</Badge>
        {selected.payment && <Badge>{selected.payment}</Badge>}
        {selected.filesComplete && <Badge tone="success">Berkas lengkap</Badge>}
      </div>
      <div>
        <DetailRow label="Pemohon">{selected.applicant}</DetailRow>
        <DetailRow label="Kegiatan">{selected.activity}</DetailRow>
        <DetailRow label="Fasilitas">{selected.venue}</DetailRow>
        <DetailRow label="Jadwal">
          {shortDate(selected.date)} · {range(selected.start, selected.end)}
        </DetailRow>
        <DetailRow label="Tarif sewa">{rupiah(selected.amount)}</DetailRow>
        {selected.file && <DetailRow label="Lampiran">{selected.file}</DetailRow>}
      </div>
      {selected.conflicts.length ? (
        <Note>
          Bentrok dengan{' '}
          {selected.conflicts.map((c) => `${c.type.toLowerCase()} "${c.name}" (${range(c.start, c.end)})`).join(', ')}. Permintaan
          tidak dapat disetujui sebelum jadwal diubah.
        </Note>
      ) : (
        <Note tone="info">Tidak ada benturan jadwal. Tagihan sewa dibuat otomatis setelah disetujui.</Note>
      )}
      <Field
        label="Catatan admin"
        as="textarea"
        placeholder="Mis. konfirmasi kebutuhan meja dan kursi"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={selected.approval !== 'Perlu ditinjau'}
      />
      <div className="btn-row">
        <button
          className="btn btn--primary"
          disabled={busy || selected.approval !== 'Perlu ditinjau' || selected.conflicts.length > 0}
          onClick={() => decide('approve', 'Pengajuan disetujui — tagihan & notifikasi terkirim')}
        >
          Setujui
        </button>
        <button className="btn" disabled={busy || selected.approval !== 'Perlu ditinjau'} onClick={() => decide('reject', 'Pengajuan ditolak — catatan admin terkirim')}>
          Tolak
        </button>
        <button className="btn" onClick={showFiles}>
          Tinjau berkas
        </button>
      </div>
    </Card>
  )
}
