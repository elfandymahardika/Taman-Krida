import { useOverlay } from '@/components/overlay'
import { mutate } from '@/lib/api'

/** Kalimat ringkas kapasitas + fungsi area. */
export const describe = (a) => [a.capacity !== undefined && `Kapasitas ${a.capacity} orang`, a.purpose].filter(Boolean).join(' · ')

/** Modal tambah/edit area fasilitas. Tanpa argumen = tambah area baru. */
export function useFormArea() {
  const overlay = useOverlay()

  return (a?) =>
    overlay.showForm({
      title: a ? 'Edit area' : 'Tambah area',
      subtitle: a ? (a.bookable ? `${a.name} · dipakai acara & sewa, nama dikunci` : a.name) : 'Area baru tampil di daftar fasilitas aplikasi publik.',
      success: a ? 'Data area berhasil diperbarui' : 'Data area berhasil ditambahkan',
      fields: [
        {
          name: 'name',
          label: 'Nama area / fasilitas',
          defaultValue: a?.name,
          placeholder: 'Contoh: Ruang Latihan Tari',
          required: true,
          readOnly: a?.bookable,
          hint: a?.bookable ? 'Nama dipakai pada data acara & sewa sehingga tidak dapat diubah.' : undefined,
        },
        { name: 'capacity', label: 'Kapasitas', type: 'number', min: 0, defaultValue: a?.capacity ?? '', placeholder: 'Jumlah orang (opsional)' },
        { name: 'purpose', label: 'Fungsi utama', defaultValue: a?.purpose, placeholder: 'Contoh: Pertunjukan tradisi', required: true },
        { name: 'note', label: 'Catatan', defaultValue: a?.note, placeholder: 'Opsional' },
      ],
      onSubmit: (d) => (a ? mutate(`/facilities/${a.id}`, { method: 'PUT', body: d }) : mutate('/facilities', { method: 'POST', body: d })),
    })
}
