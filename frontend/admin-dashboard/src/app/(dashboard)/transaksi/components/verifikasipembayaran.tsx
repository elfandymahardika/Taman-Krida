'use client'

import { useState } from 'react'
import { FileText, Sparkles } from 'lucide-react'
import { Badge, Card, DetailRow, Field, Note } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { rupiah, wibDateTime } from '@/data/format'
import { mutate, openFile } from '@/lib/api'

/** Periksa bukti transfer satu pesanan, lalu verifikasi lunas atau minta bukti ulang. */
export default function VerifikasiPembayaran({ order: selected }: { order: any }) {
  const overlay = useOverlay()
  const [note, setNote] = useState('Nominal dan nama pengirim sesuai dengan tagihan.')
  const [busy, setBusy] = useState(false)
  const canDecide = selected.payment === 'Perlu verifikasi' && !busy

  const decide = async (action: string, message: string) => {
    setBusy(true)
    try {
      await mutate(`/orders/${selected.id}/${action}`, { method: 'POST', body: { note } })
      overlay.toast(message)
    } catch (err) {
      overlay.toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Verifikasi pembayaran" subtitle={`${selected.id} · ${selected.customer}`}>
      <div>
        <Badge>{selected.payment}</Badge>
      </div>
      <div>
        <DetailRow label="Layanan">{selected.service}</DetailRow>
        <DetailRow label="Metode">{selected.proof.method}</DetailRow>
      </div>
      <div className="receipt">
        <p className="receipt__type">Bukti transfer</p>
        <p className="receipt__title">{selected.proof.method}</p>
        <p className="receipt__amount">{rupiah(selected.amount)}</p>
        <div className="divider" />
        <p className="muted" style={{ fontSize: 11 }}>
          {selected.proof.from} · Diunggah {wibDateTime(selected.proof.submittedAt)}
        </p>
        <button
          className="receipt__file"
          title="Buka bukti transfer di tab baru"
          onClick={() => openFile(`/orders/${selected.id}/proof`).catch((err) => overlay.toast(err.message, 'error'))}
        >
          <FileText strokeWidth={1.75} /> {selected.proof.file}
        </button>
      </div>
      <Note>Nominal sesuai tagihan. Cocokkan nama pengirim dan tanggal mutasi rekening sebelum memverifikasi.</Note>
      <Field label="Catatan verifikasi" as="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="btn-row">
        <button className="btn btn--primary" disabled={!canDecide} onClick={() => decide('verify', 'Pembayaran terverifikasi — tiket/sewa diaktifkan')}>
          Verifikasi lunas
        </button>
        <button className="btn" disabled={!canDecide} onClick={() => decide('reject', 'Permintaan bukti ulang terkirim')}>
          Minta ulang
        </button>
      </div>
      <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
        Keputusan tersimpan di server dan tercatat di log aktivitas · Tidak memproses dana nyata.
      </p>
      <div className="ai-plan">
        <p className="ai-plan__head">
          <Sparkles strokeWidth={1.75} /> Rencana fitur AI · Pemeriksa bukti transfer
        </p>
        <p>
          Tahap berikutnya, AI akan membaca foto bukti transfer (OCR), lalu mencocokkan nominal, nama pengirim,
          dan tanggal dengan tagihan. Hasilnya berupa saran keputusan dan skor keyakinan. Keputusan akhir tetap
          di tangan admin.
        </p>
        <ul>
          <li>Contoh saran: “Cocok 96% · nominal &amp; nama sesuai”</li>
          <li>Menandai bukti yang diedit atau dipakai ulang</li>
        </ul>
        <Badge tone="neutral">Belum aktif · rancangan</Badge>
      </div>
    </Card>
  )
}

/** Ditampilkan bila tidak ada bukti transfer yang menunggu. */
export function VerifikasiKosong() {
  return (
    <Card title="Verifikasi pembayaran" subtitle="Antrean kosong">
      <Note tone="info">Tidak ada bukti transfer yang menunggu. Pembayaran baru dari aplikasi mobile akan muncul di sini.</Note>
    </Card>
  )
}
