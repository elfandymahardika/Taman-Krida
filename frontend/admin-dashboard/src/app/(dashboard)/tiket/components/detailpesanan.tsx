'use client'

import { Badge, Card, DetailRow } from '@/components/ui'
import { useOverlay } from '@/components/overlay'
import { rupiah, wibDateTime } from '@/data/format'

/** Rincian pesanan terpilih: kode tiket, check-in, dan aksi sesuai status pembayaran. */
export default function DetailPesanan({ order: selected, onVerify }: { order: any; onVerify: (order: any) => void }) {
  const overlay = useOverlay()

  return (
    <Card title="Detail pesanan" subtitle={`${selected.id} · ${selected.customer}`}>
      <div>
        <Badge>{selected.payment}</Badge>
      </div>
      <div>
        <DetailRow label="Pertunjukan">{selected.service}</DetailRow>
        <DetailRow label="Tiket">
          {selected.qty} tiket reguler · {rupiah(selected.amount)}
        </DetailRow>
        <DetailRow label="Penerbitan">{selected.paidAt ? wibDateTime(selected.paidAt) : '—'}</DetailRow>
        <DetailRow label="Kode tiket">{selected.ticket.codes.length ? selected.ticket.codes.join(' · ') : 'Diterbitkan setelah lunas'}</DetailRow>
        <DetailRow label="Check-in">{selected.payment === 'Lunas' ? `Belum digunakan (${selected.qty} tiket)` : '—'}</DetailRow>
      </div>
      <div className="btn-row">
        {selected.payment === 'Lunas' ? (
          <button className="btn btn--primary" onClick={() => overlay.toast('Contoh prototype: tiket dikirim ulang ke email pemesan', 'info')}>
            Kirim ulang tiket
          </button>
        ) : selected.payment === 'Perlu verifikasi' ? (
          <button className="btn btn--primary" onClick={() => onVerify(selected)}>
            Verifikasi pembayaran
          </button>
        ) : (
          <p className="muted" style={{ fontSize: 11 }}>
            Menunggu pemesan membayar.
          </p>
        )}
      </div>
    </Card>
  )
}
