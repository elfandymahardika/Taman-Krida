import { useOverlay } from '@/components/overlay'
import { orderDetail, rupiah, wibDateTime } from '@/data/format'
import { mutate } from '@/lib/api'

export const METHODS = ['Transfer bank', 'QRIS', 'Tunai di loket']

/** Aksi bersama halaman Transaksi: catat pembayaran manual dan lihat rincian pesanan. */
export function useAksiTransaksi() {
  const overlay = useOverlay()

  /** Formulir pembayaran di luar aplikasi; `o` mengisi nomor & nominal tagihan. */
  const recordPayment = (o?) =>
    overlay.showForm({
      title: 'Catat pembayaran',
      subtitle: 'Untuk pembayaran di luar aplikasi, mis. tunai di loket. Nominal harus sama dengan tagihan.',
      success: 'Pembayaran berhasil dicatat — status menjadi lunas',
      fields: [
        { name: 'nomor', label: 'Nomor transaksi', placeholder: 'Contoh: TK-1026-0124', defaultValue: o?.id, required: true },
        { name: 'nominal', label: 'Nominal (Rp)', type: 'number', min: 0, step: 1000, defaultValue: o?.amount, required: true },
        { name: 'metode', label: 'Metode pembayaran', as: 'select', options: METHODS, defaultValue: 'Tunai di loket' },
        { name: 'catatan', label: 'Catatan', placeholder: 'Opsional' },
      ],
      onSubmit: (d) =>
        mutate(`/orders/${encodeURIComponent(d.nomor.trim().toUpperCase())}/payment`, {
          method: 'POST',
          body: { amount: Number(d.nominal), method: d.metode, note: d.catatan },
        }),
    })

  const showOrder = (o) =>
    overlay.showDetail({
      subtitle: `${o.id} · ${o.type}`,
      rows: [
        ['Pemesan', o.customer],
        ['Layanan', o.service],
        ['Rincian', orderDetail(o)],
        ['Nominal', rupiah(o.amount)],
        ['Pembayaran', o.payment],
        ...(o.paidAt ? [['Lunas pada', `${wibDateTime(o.paidAt)}${o.method ? ` · ${o.method}` : ''}`]] : []),
        ...(o.note ? [['Catatan', o.note]] : []),
      ],
      cancelLabel: 'Tutup',
      ...(o.payment === 'Menunggu bayar' && {
        primaryLabel: 'Catat pembayaran',
        success: 'Membuka formulir',
        onPrimary: () => setTimeout(() => recordPayment(o)),
      }),
    })

  return { recordPayment, showOrder }
}
