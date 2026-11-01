'use client'

import { Card, Cell, DataTable, TableFoot } from '@/components/ui'
import { rupiah, wibDateTime } from '@/data/format'

type Props = {
  /** Pesanan dengan status "Perlu verifikasi". */
  queue: any[]
  selectedId?: string
  onSelect: (id: string) => void
}

/** Bukti transfer yang menunggu diperiksa sebelum tiket/sewa diaktifkan. */
export default function AntreanVerifikasi({ queue, selectedId, onSelect }: Props) {
  return (
    <Card title="Antrean verifikasi" subtitle="Bukti transfer yang perlu diperiksa sebelum tiket atau sewa diaktifkan.">
      <DataTable
        columns={[
          { label: 'Transaksi / pengirim', width: 210, render: (o) => <Cell main={o.id} sub={o.customer} /> },
          { label: 'Bukti diunggah', width: 180, render: (o) => <p>{wibDateTime(o.proof.submittedAt)}</p> },
          { label: 'Nominal', width: 130, render: (o) => <p>{rupiah(o.amount)}</p> },
          { label: 'Aksi', width: 90, render: () => <p className="cell__action">Periksa →</p> },
        ]}
        rows={queue}
        getKey={(o) => o.id}
        selected={selectedId}
        onRowClick={(o) => onSelect(o.id)}
        footer={<TableFoot>{queue.length ? `${queue.length} pembayaran menunggu pemeriksaan` : 'Antrean kosong — semua bukti sudah diperiksa'}</TableFoot>}
      />
    </Card>
  )
}
