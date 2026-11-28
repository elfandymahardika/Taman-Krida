import { useOverlay } from '@/components/overlay'
import { api, mutate } from '@/lib/api'
import { rupiah, wibDateTime } from '@/data/format'

/** Akun pengunjung dari GET /api/visitors. */
export type Visitor = {
  id: number
  name: string
  email: string
  phone: string
  city: string
  status: 'Aktif' | 'Nonaktif'
  disabledNote?: string
  disabledAt?: string
  createdAt: string
  orders: number
  rentals: number
  communities: number
  activeSessions: number
  lastLogin?: string
}

export const STATUSES = ['Aktif', 'Nonaktif']

/** Ringkasan aktivitas satu baris: "2 tiket · 1 sewa · 1 komunitas". */
export const activityOf = (v: Visitor) =>
  [v.orders && `${v.orders} pesanan tiket`, v.rentals && `${v.rentals} sewa`, v.communities && `${v.communities} komunitas`].filter(Boolean).join(' · ') ||
  'Belum ada aktivitas'

/** Aksi halaman Akun pengunjung: rincian, nonaktifkan (wajib alasan), aktifkan kembali. */
export function useAksiPengunjung() {
  const overlay = useOverlay()

  const showDetail = async (v: Visitor) => {
    try {
      const detail = await api(`/visitors/${v.id}`)
      const orders = detail.activity.orders.map((o) => `${o.id} · ${o.service} · ${rupiah(o.amount)} · ${o.payment}`)
      const rentals = detail.activity.rentals.map((r) => `${r.id} · ${r.venue} · ${r.date} · ${r.approval}`)
      overlay.showDetail({
        title: 'Rincian akun pengunjung',
        subtitle: `${v.name} · ${v.email}`,
        rows: [
          ['Telepon', v.phone],
          ['Kota', v.city || '—'],
          ['Terdaftar', wibDateTime(v.createdAt)],
          ['Login terakhir', v.lastLogin ? wibDateTime(v.lastLogin) : 'Belum pernah'],
          ['Sesi aktif', `${detail.activeSessions} perangkat`],
          ['Pesanan tiket terbaru', orders.length ? orders.join('\n') : '—'],
          ['Pengajuan sewa terbaru', rentals.length ? rentals.join('\n') : '—'],
          ['Komunitas didaftarkan', String(v.communities)],
          ['Status', v.status === 'Nonaktif' ? `Nonaktif sejak ${wibDateTime(v.disabledAt)} · ${v.disabledNote}` : 'Aktif'],
        ],
        cancelLabel: 'Tutup',
      })
    } catch (err) {
      overlay.toast((err as Error).message, 'error')
    }
  }

  const deactivate = (v: Visitor) =>
    overlay.showForm({
      title: 'Nonaktifkan akun?',
      subtitle: `${v.name} · ${v.email}. Pengunjung langsung keluar dari aplikasi dan tidak bisa masuk lagi sampai diaktifkan kembali. Pesanan & pengajuan sewanya tetap tersimpan.`,
      submitLabel: 'Nonaktifkan',
      success: 'Akun pengunjung dinonaktifkan',
      fields: [
        {
          name: 'note',
          label: 'Alasan',
          as: 'textarea',
          rows: 3,
          required: true,
          minLength: 5,
          maxLength: 200,
          placeholder: 'Contoh: Mengunggah bukti transfer palsu berulang kali.',
          hint: 'Tercatat di log aktivitas dan rincian akun (tidak dikirim ke pengunjung).',
        },
      ],
      validate: (d) => (String(d.note ?? '').trim().length < 5 ? { note: 'Tulis alasan minimal 5 karakter.' } : {}),
      onSubmit: (d) => mutate(`/visitors/${v.id}`, { method: 'PATCH', body: { status: 'Nonaktif', note: d.note } }),
    })

  const activate = (v: Visitor) =>
    overlay.showDetail({
      title: 'Aktifkan kembali akun?',
      subtitle: `${v.name} · ${v.email}`,
      rows: [
        ['Dinonaktifkan', `${wibDateTime(v.disabledAt)} · ${v.disabledNote ?? '—'}`],
        ['Setelah diaktifkan', 'Pengunjung bisa masuk lagi ke aplikasi dengan akun yang sama.'],
      ],
      primaryLabel: 'Aktifkan',
      success: 'Akun pengunjung aktif kembali',
      onPrimary: () => mutate(`/visitors/${v.id}`, { method: 'PATCH', body: { status: 'Aktif' } }),
    })

  return { showDetail, deactivate, activate }
}
