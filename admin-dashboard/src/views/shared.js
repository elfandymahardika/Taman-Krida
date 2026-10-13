import { EVENT_STATUSES, VENUES, eventStore, formatDate, timeRange, validateEvent } from '../data/events'

/**
 * Formulir tambah/edit acara (modal / Tambah acara). Divalidasi lalu disimpan ke localStorage.
 * `list` = daftar acara saat ini, untuk cek duplikat.
 */
export const eventForm = (list, e) => ({
  title: e ? 'Edit acara' : 'Tambah acara',
  subtitle: e ? e.name : 'Lengkapi data lalu simpan. Kolom bertanda * wajib diisi.',
  success: e ? 'Perubahan acara tersimpan' : 'Data acara berhasil ditambahkan',
  validate: (data) => validateEvent(data, list, e?.id),
  onSubmit: (data) => (e ? eventStore.update(e.id, data) : eventStore.add(data)),
  fields: [
    { name: 'name', label: 'Nama acara', placeholder: 'Contoh: Pagelaran Wayang Kulit', defaultValue: e?.name, required: true, maxLength: 80 },
    { name: 'organizer', label: 'Penyelenggara', placeholder: 'Contoh: Sanggar Tari Mekar Sari', defaultValue: e?.organizer, required: true },
    { name: 'date', label: 'Tanggal', type: 'date', defaultValue: e?.date ?? '2026-10-15', required: true },
    {
      row: [
        { name: 'start', label: 'Jam mulai', type: 'time', defaultValue: e?.start ?? '19:00', required: true },
        { name: 'end', label: 'Jam selesai', type: 'time', defaultValue: e?.end ?? '21:00', required: true },
      ],
    },
    {
      row: [
        { name: 'venue', label: 'Lokasi / fasilitas', as: 'select', options: VENUES, defaultValue: e?.venue },
        { name: 'status', label: 'Status publikasi', as: 'select', options: EVENT_STATUSES, defaultValue: e?.status ?? 'Draf' },
      ],
    },
    { name: 'quota', label: 'Kuota tiket', type: 'number', min: 0, defaultValue: e?.quota ?? '', hint: 'Kosongkan jika acara tanpa tiket berbayar.' },
  ],
})

/** Modal rincian acara (modal / Detail …). */
export const eventDetail = (e, navigate) => ({
  subtitle: e.name,
  rows: [
    ['Penyelenggara', e.organizer],
    ['Tanggal', formatDate(e)],
    ['Waktu', timeRange(e)],
    ['Lokasi', e.venue],
    ...(e.quota !== undefined ? [['Penjualan', `${e.sold ?? 0} / ${e.quota} tiket`]] : []),
    ['Publikasi', e.status],
  ],
  cancelLabel: 'Tutup',
  primaryLabel: navigate ? 'Kelola acara' : undefined,
  onPrimary: navigate ? () => navigate('/acara') : undefined,
  success: 'Membuka pengelolaan acara',
})
