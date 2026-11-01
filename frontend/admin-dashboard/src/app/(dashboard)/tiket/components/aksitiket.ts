import { useOverlay } from '@/components/overlay'
import { rupiah } from '@/data/format'
import { eventStore } from '@/data/events'
import type { Event } from '@/data/events'
import { mutate } from '@/lib/api'
import type { FieldErrors } from '@/lib/api'

/** Aksi bersama halaman Tiket: atur kuota & harga acara, dan verifikasi pembayaran pesanan. */
export function useAksiTiket(ticketed: Event[]) {
  const overlay = useOverlay()

  /** Formulir inventori; tanpa argumen = pilih acara di formulir. */
  const openInventory = (e?: Event) =>
    overlay.showForm({
      title: 'Atur inventori tiket',
      subtitle: e ? e.name : 'Kuota penjualan per acara',
      success: 'Inventori tiket diperbarui',
      validate: (d) => {
        const errors: FieldErrors = {}
        const target = ticketed.find((t) => t.name === d.acara)
        const q = Number(d.quota)
        if (!Number.isInteger(q) || q < 1) errors.quota = 'Kuota harus bilangan bulat minimal 1.'
        else if (target && q < (target.sold ?? 0)) errors.quota = `Kuota tidak boleh kurang dari tiket terjual (${target.sold}).`
        if (Number(d.price) < 0) errors.price = 'Harga tidak boleh negatif.'
        return errors
      },
      onSubmit: (d) => {
        const target = ticketed.find((t) => t.name === d.acara)
        return eventStore.patch(target.id, { quota: Number(d.quota), price: Number(d.price) })
      },
      fields: [
        { name: 'acara', label: 'Pilih acara', as: 'select', options: ticketed.map((t) => t.name), defaultValue: e?.name },
        { name: 'quota', label: 'Kuota tiket', type: 'number', min: 1, defaultValue: e?.quota ?? 300, required: true },
        { name: 'price', label: 'Harga tiket (Rp)', type: 'number', min: 0, step: 1000, defaultValue: e?.price ?? 50000 },
      ],
    })

  const verify = (o) =>
    overlay.showDetail({
      subtitle: o.id,
      rows: [
        ['Pemesan', o.customer],
        ['Pertunjukan', o.service],
        ['Jumlah', `${o.qty} tiket · ${rupiah(o.amount)}`],
        ['Pembayaran', o.payment],
        ['Status tiket', o.ticket.status],
      ],
      primaryLabel: 'Verifikasi',
      success: `Pembayaran terverifikasi — ${o.qty} tiket diterbitkan`,
      onPrimary: () => mutate(`/orders/${o.id}/verify`, { method: 'POST' }),
    })

  return { openInventory, verify }
}
