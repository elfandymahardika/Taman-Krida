import { AUTO_CATEGORY, EVENT_CATEGORIES, EVENT_STATUSES, VENUES, eventStore, formatDate, pickedImage, timeRange, validateEvent, validateEventImage } from './events'
import type { Event, EventInput } from './events'
import { rupiah, todayWib } from './format'
import type { DetailOptions, FormOptions } from '../components/overlay'

/**
 * Formulir tambah/edit acara (modal / Tambah acara). Divalidasi di browser lalu disimpan lewat API.
 * `list` = daftar acara saat ini, untuk cek duplikat. `date` = tanggal awal untuk acara baru
 * (mis. tanggal yang dipilih di kalender).
 */
const KEEP_IMAGE = 'Pertahankan gambar saat ini'
const REMOVE_IMAGE = 'Hapus gambar'

/**
 * Simpan acara lalu gambarnya: data acara dikirim sebagai JSON, gambar diunggah terpisah ke
 * POST /events/:id/image (berkas mentah). Bila unggahan gagal, acara tetap tersimpan dan pesan
 * kesalahannya muncul di formulir (bisa dicoba lagi lewat Edit acara).
 */
async function saveEvent(e: Event | undefined, data: Record<string, any>) {
  const { gambar, gambarAksi, ...fields } = data
  if (fields.category === AUTO_CATEGORY) fields.category = ''
  const saved: Event = e ? await eventStore.update(e.id, fields as EventInput) : await eventStore.add(fields as EventInput)
  const file = pickedImage(gambar)
  if (file) await eventStore.uploadImage(saved.id, file)
  else if (gambarAksi === REMOVE_IMAGE) await eventStore.removeImage(saved.id)
  return saved
}

export const eventForm = (list: Event[], e?: Event, date = todayWib()): FormOptions => ({
  title: e ? 'Edit acara' : 'Tambah acara',
  subtitle: e ? e.name : 'Lengkapi data lalu simpan. Kolom bertanda * wajib diisi.',
  success: e ? 'Perubahan acara tersimpan' : 'Data acara berhasil ditambahkan',
  validate: (data) => {
    const errors = validateEvent(data, list, e?.id)
    const image = validateEventImage(data.gambar)
    return image ? { ...errors, gambar: image } : errors
  },
  onSubmit: (data) => saveEvent(e, data),
  fields: [
    { name: 'name', label: 'Nama acara', placeholder: 'Contoh: Pagelaran Wayang Kulit', defaultValue: e?.name, required: true, maxLength: 80 },
    { name: 'organizer', label: 'Penyelenggara', placeholder: 'Contoh: Sanggar Tari Mekar Sari', defaultValue: e?.organizer, required: true },
    { name: 'date', label: 'Tanggal', type: 'date', defaultValue: e?.date ?? date, required: true },
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
    {
      name: 'category',
      label: 'Kategori di aplikasi',
      as: 'select',
      options: [AUTO_CATEGORY, ...EVENT_CATEGORIES],
      defaultValue: e?.category || AUTO_CATEGORY,
      hint: 'Dipakai filter Kalender Acara di aplikasi mobile.',
    },
    {
      row: [
        { name: 'quota', label: 'Kuota tiket', type: 'number', min: 0, defaultValue: e?.quota ?? '', hint: 'Kosongkan bila pengunjung datang langsung tanpa tiket.' },
        { name: 'price', label: 'Harga tiket (Rp)', type: 'number', min: 0, step: 1000, defaultValue: e?.price ?? '', hint: 'Isi 0 untuk tiket gratis (tanpa pembayaran). Kosong = Rp50.000.' },
      ],
    },
    {
      name: 'gambar',
      label: e?.imageUrl ? 'Ganti gambar acara' : 'Gambar acara',
      type: 'file',
      accept: 'image/jpeg,image/png,image/webp',
      hint: 'JPG, PNG, atau WEBP, maks. 5 MB. Tampil di kalender dashboard dan aplikasi pengunjung.',
    },
    ...(e?.imageUrl
      ? [{ name: 'gambarAksi', label: 'Gambar saat ini', as: 'select' as const, options: [KEEP_IMAGE, REMOVE_IMAGE], defaultValue: KEEP_IMAGE }]
      : []),
  ],
})

/** Modal rincian acara (modal / Detail …). */
export const eventDetail = (e: Event, navigate?: (path: string) => void): DetailOptions => ({
  subtitle: e.name,
  rows: [
    ['Penyelenggara', e.organizer],
    ['Tanggal', formatDate(e)],
    ['Waktu', timeRange(e)],
    ['Lokasi', e.venue],
    ...(e.quota !== undefined
      ? [['Penjualan', `${e.sold ?? 0} / ${e.quota} tiket`], ['Harga', e.price ? rupiah(e.price) : 'Gratis (ambil tiket)']]
      : [['Tiket', 'Tanpa tiket · datang langsung']]),
    ['Publikasi', e.status],
  ],
  cancelLabel: 'Tutup',
  primaryLabel: navigate ? 'Kelola acara' : undefined,
  onPrimary: navigate ? () => navigate('/acara') : undefined,
  success: 'Membuka pengelolaan acara',
})
