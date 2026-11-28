import type { FormOptions } from '@/components/overlay'
import { mutate } from '@/lib/api'
import { CATEGORIES } from './hero'

/** Jadwal latihan: satu baris "hari | jam". Mengembalikan pesan error atau undefined. */
function validateSchedule(value: unknown) {
  const lines = String(value ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length > 7) return 'Maksimal 7 baris.'
  const bad = lines.findIndex((l) => l.split('|').length !== 2 || l.split('|').some((p) => !p.trim()))
  return bad >= 0 ? `Baris ${bad + 1}: gunakan format "hari | jam", mis. "Sabtu | 15.00–17.00".` : undefined
}

/**
 * Formulir edit komunitas: semua isian tampil di Direktori Komunitas aplikasi mobile
 * (profil, kontak WhatsApp, jadwal latihan, jumlah pentas).
 */
export const communityForm = (c): FormOptions => ({
  title: 'Edit komunitas',
  subtitle: `${c.name} · perubahan langsung tampil di Direktori Komunitas aplikasi.`,
  success: 'Data komunitas tersimpan',
  validate: (d) => {
    const schedule = validateSchedule(d.schedule)
    return schedule ? { schedule } : {}
  },
  onSubmit: (d) => mutate(`/communities/${c.id}`, { method: 'PUT', body: d }),
  fields: [
    { name: 'name', label: 'Nama komunitas', defaultValue: c.name, required: true, maxLength: 100 },
    {
      row: [
        { name: 'category', label: 'Kategori', as: 'select', options: CATEGORIES, defaultValue: c.category },
        { name: 'city', label: 'Kota / domisili', defaultValue: c.city, required: true, maxLength: 60 },
      ],
    },
    {
      row: [
        { name: 'leader', label: 'Ketua / pengurus', defaultValue: c.leader ?? '', maxLength: 100 },
        { name: 'contact', label: 'Kontak WhatsApp', type: 'tel', defaultValue: c.contact === '—' ? '' : c.contact, placeholder: '08xx-xxxx-xxxx' },
      ],
    },
    {
      row: [
        { name: 'members', label: 'Jumlah anggota', type: 'number', min: 0, defaultValue: c.members ?? 0 },
        { name: 'since', label: 'Berdiri sejak', defaultValue: c.since ?? '', placeholder: 'Contoh: 1998', maxLength: 40 },
      ],
    },
    { name: 'performances', label: 'Jumlah pentas', defaultValue: c.performances, placeholder: 'Contoh: 120+ pentas', maxLength: 40 },
    { name: 'address', label: 'Alamat sanggar / tempat latihan', defaultValue: c.address, maxLength: 200 },
    {
      name: 'description',
      label: 'Deskripsi',
      as: 'textarea',
      rows: 3,
      defaultValue: c.description,
      maxLength: 500,
      hint: 'Tampil di bagian "Tentang" profil komunitas di aplikasi.',
    },
    {
      name: 'schedule',
      label: 'Jadwal latihan',
      as: 'textarea',
      rows: 3,
      defaultValue: c.schedule,
      placeholder: 'Sabtu | 15.00–17.00\nMinggu | 09.00–11.00',
      hint: 'Satu baris satu jadwal: hari | jam. Kosongkan bila belum ada (aplikasi menampilkan "Hubungi pengurus").',
    },
  ],
})
