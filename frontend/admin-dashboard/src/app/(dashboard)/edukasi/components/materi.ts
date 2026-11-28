import { mutate, upload } from '@/lib/api'
import type { FieldErrors } from '@/lib/api'
import type { FormOptions } from '@/components/overlay'
import { pickedImage, validateEventImage } from '@/data/events'

/*
 * Materi Edukasi Budaya: tampil di menu Edukasi aplikasi mobile (hanya yang Terpublikasi).
 * Linimasa & filosofi diisi sebagai baris teks "a | b" di formulir, lalu dikirim ke API sebagai array.
 */

export type CultureImage = { key: string; url?: string; builtin?: string }
/** Video materi: berkas unggahan (diputar di aplikasi) atau tautan YouTube/URL video. */
export type CultureVideo = { kind: 'file' | 'link'; url: string }
export type Culture = {
  id: string
  title: string
  category: string
  summary: string
  headline: string
  readMinutes: number
  history: string
  timelineTitle: string
  timeline: { label: string; text: string }[]
  philosophy: { symbol: string; title: string; text: string }[]
  images: CultureImage[]
  videoMinutes: number
  video: CultureVideo | null
  status: 'Terpublikasi' | 'Draf'
  author: string
  createdAt: string
  updatedAt: string
}

export const STATUSES = ['Draf', 'Terpublikasi']
/** Kategori bawaan (chip filter aplikasi); admin boleh mengetik kategori baru. */
export const CATEGORIES = ['Pertunjukan', 'Musik', 'Arsitektur', 'Tari', 'Kriya']
export const CATEGORY_LIST_ID = 'kategori-edukasi'
export const MAX_IMAGES = 8
/** Sama dengan UPLOAD_LIMIT_MB backend (bawaan 25 MB). */
export const VIDEO_MAX_MB = 25
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const KEEP_VIDEO = 'Pertahankan video saat ini'
const REMOVE_VIDEO = 'Hapus video'
const MAX_POINTS = 10

/** Teks baris → kolom-kolom yang dipisah "|". Baris kosong diabaikan. */
const lines = (value: unknown) =>
  String(value ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split('|').map((p) => p.trim()))

export function parseTimeline(value: unknown) {
  const rows = lines(value)
  if (rows.length > MAX_POINTS) return { error: `Maksimal ${MAX_POINTS} baris.` }
  const bad = rows.findIndex((r) => r.length !== 2 || !r[0] || !r[1])
  if (bad >= 0) return { error: `Baris ${bad + 1}: gunakan format "label | keterangan".` }
  return { list: rows.map(([label, text]) => ({ label, text })) }
}

export function parsePhilosophy(value: unknown) {
  const rows = lines(value)
  if (rows.length > MAX_POINTS) return { error: `Maksimal ${MAX_POINTS} baris.` }
  // "judul | makna" (tanpa simbol) atau "simbol | judul | makna".
  const list = rows.map((r) => (r.length === 2 ? ['', ...r] : r))
  const bad = list.findIndex((r) => r.length !== 3 || !r[1] || !r[2])
  if (bad >= 0) return { error: `Baris ${bad + 1}: gunakan format "simbol | judul | makna" (simbol boleh kosong).` }
  return { list: list.map(([symbol, title, text]) => ({ symbol, title, text })) }
}

export const timelineText = (c?: Culture) => c?.timeline.map((p) => `${p.label} | ${p.text}`).join('\n') ?? ''
export const philosophyText = (c?: Culture) => c?.philosophy.map((p) => `${p.symbol} | ${p.title} | ${p.text}`).join('\n') ?? ''

/** API materi edukasi (semua memanggil invalidate() sehingga daftar ikut segar). */
export const cultureStore = {
  add: (body: object) => mutate<Culture>('/culture', { method: 'POST', body }),
  update: (id: string, body: object) => mutate<Culture>(`/culture/${id}`, { method: 'PUT', body }),
  setStatus: (id: string, status: string) => mutate<Culture>(`/culture/${id}`, { method: 'PATCH', body: { status } }),
  /** Urutan baru foto (foto pertama = sampul); foto yang tidak disertakan dihapus. */
  setImages: (id: string, images: string[]) => mutate<Culture>(`/culture/${id}`, { method: 'PATCH', body: { images } }),
  uploadImage: (id: string, file: File, cover = false) =>
    upload<Culture>(`/culture/${id}/images?name=${encodeURIComponent(file.name)}${cover ? '&cover=1' : ''}`, file).promise,
  uploadVideo: (id: string, file: File, onProgress?: (percent: number) => void) =>
    upload<Culture>(`/culture/${id}/video?name=${encodeURIComponent(file.name)}`, file, { onProgress }).promise,
  setVideoLink: (id: string, link: string) => mutate<Culture>(`/culture/${id}/video`, { method: 'PUT', body: { link } }),
  removeVideo: (id: string) => mutate<Culture>(`/culture/${id}/video`, { method: 'DELETE' }),
  remove: (id: string) => mutate(`/culture/${id}`, { method: 'DELETE' }),
}

export function validateVideoFile(value: unknown) {
  const file = pickedImage(value)
  if (!file) return undefined
  if (!VIDEO_TYPES.includes(file.type)) return 'Video harus berformat MP4, WEBM, atau MOV.'
  if (file.size > VIDEO_MAX_MB * 1024 * 1024) return `Ukuran video maksimal ${VIDEO_MAX_MB} MB.`
  return undefined
}

export function validateVideoLink(value: unknown) {
  const link = String(value ?? '').trim()
  if (!link) return undefined
  try {
    const url = new URL(link)
    if (url.protocol === 'https:' && url.hostname.includes('.')) return undefined
  } catch {
    // jatuh ke pesan di bawah
  }
  return 'Tautan harus diawali "https://", mis. https://www.youtube.com/watch?v=…'
}

/**
 * Simpan video setelah materi tersimpan: berkas baru > hapus > tautan baru/berubah > tautan dikosongkan.
 * Berkas dan tautan saling menggantikan (satu materi satu video).
 */
async function saveVideo(c: Culture | undefined, id: string, d: Record<string, any>) {
  const file = pickedImage(d.videoFile)
  const link = String(d.videoLink ?? '').trim()
  const current = c?.video
  if (file) return cultureStore.uploadVideo(id, file)
  if (d.videoAksi === REMOVE_VIDEO) return cultureStore.removeVideo(id)
  if (link && !(current?.kind === 'link' && current.url === link)) return cultureStore.setVideoLink(id, link)
  if (!link && current?.kind === 'link') return cultureStore.removeVideo(id)
}

/** Isian formulir → body API. Linimasa/filosofi sudah lolos validasi parse. */
const toBody = (d: Record<string, any>) => ({
  title: d.title,
  category: d.category,
  status: d.status,
  readMinutes: Number(d.readMinutes),
  summary: d.summary,
  headline: d.headline,
  history: d.history,
  timelineTitle: d.timelineTitle,
  videoMinutes: Number(d.videoMinutes || 0),
  timeline: parseTimeline(d.timeline).list,
  philosophy: parsePhilosophy(d.philosophy).list,
})

function validateCulture(d: Record<string, any>): FieldErrors {
  const errors: FieldErrors = {}
  const read = Number(d.readMinutes)
  if (!Number.isInteger(read) || read < 1 || read > 60) errors.readMinutes = 'Isi 1–60 menit.'
  const video = Number(d.videoMinutes || 0)
  if (!Number.isInteger(video) || video < 0 || video > 180) errors.videoMinutes = 'Isi 0–180 menit.'
  if (String(d.summary ?? '').trim().length < 10) errors.summary = 'Ringkasan minimal 10 karakter.'
  if (String(d.headline ?? '').trim().length < 10) errors.headline = 'Kalimat pembuka minimal 10 karakter.'
  if (String(d.history ?? '').trim().length < 20) errors.history = 'Sejarah minimal 20 karakter.'
  const timeline = parseTimeline(d.timeline)
  if (timeline.error) errors.timeline = timeline.error
  const philosophy = parsePhilosophy(d.philosophy)
  if (philosophy.error) errors.philosophy = philosophy.error
  const videoFile = validateVideoFile(d.videoFile)
  if (videoFile) errors.videoFile = videoFile
  const videoLink = validateVideoLink(d.videoLink)
  if (videoLink) errors.videoLink = videoLink
  if (pickedImage(d.videoFile) && String(d.videoLink ?? '').trim()) errors.videoLink = 'Pilih salah satu: tautan atau berkas video.'
  const image = validateEventImage(d.gambar)
  if (image) errors.gambar = image.replace('Gambar', 'Foto').replace('gambar', 'foto')
  return errors
}

/** Formulir tambah/edit materi (modal). Materi baru bisa langsung diberi foto sampul. */
export const cultureForm = (c?: Culture): FormOptions => ({
  title: c ? 'Edit materi edukasi' : 'Tambah materi edukasi',
  subtitle: c
    ? `${c.title} · tampil di menu Edukasi aplikasi bila berstatus Terpublikasi.`
    : 'Materi tampil di menu Edukasi aplikasi mobile setelah diterbitkan. Kolom bertanda * wajib diisi.',
  success: c ? 'Perubahan materi tersimpan' : 'Materi edukasi ditambahkan',
  validate: validateCulture,
  onSubmit: async (d) => {
    const saved = c ? await cultureStore.update(c.id, toBody(d)) : await cultureStore.add(toBody(d))
    const file = pickedImage(d.gambar)
    if (file) await cultureStore.uploadImage(saved.id, file, true)
    await saveVideo(c, saved.id, d)
  },
  fields: [
    { name: 'title', label: 'Judul materi', placeholder: 'Contoh: Tari Remo', defaultValue: c?.title, required: true, maxLength: 80 },
    {
      row: [
        { name: 'category', label: 'Kategori', placeholder: 'Pilih atau ketik kategori', list: CATEGORY_LIST_ID, defaultValue: c?.category ?? 'Pertunjukan', required: true, maxLength: 40 },
        { name: 'status', label: 'Status', as: 'select', options: STATUSES, defaultValue: c?.status ?? 'Draf' },
      ],
    },
    {
      row: [
        { name: 'readMinutes', label: 'Lama baca (menit)', type: 'number', min: 1, max: 60, defaultValue: c?.readMinutes ?? 5, required: true },
        { name: 'videoMinutes', label: 'Durasi video (menit)', type: 'number', min: 0, max: 180, defaultValue: c?.videoMinutes ?? 0, hint: 'Opsional, tampil di keterangan video. 0 = tidak ditampilkan.' },
      ],
    },
    { name: 'summary', label: 'Ringkasan (kartu materi)', as: 'textarea', rows: 2, defaultValue: c?.summary, required: true, maxLength: 200, placeholder: 'Kalimat singkat di kartu daftar materi.' },
    { name: 'headline', label: 'Kalimat pembuka (halaman detail)', as: 'textarea', rows: 2, defaultValue: c?.headline, required: true, maxLength: 200 },
    { name: 'history', label: 'Sejarah', as: 'textarea', rows: 5, defaultValue: c?.history, required: true, maxLength: 5000, hint: 'Tampil di tab Sejarah.' },
    { name: 'timelineTitle', label: 'Judul linimasa', defaultValue: c?.timelineTitle ?? 'Linimasa', required: true, maxLength: 60 },
    {
      name: 'timeline',
      label: 'Linimasa',
      as: 'textarea',
      rows: 4,
      defaultValue: timelineText(c),
      placeholder: '1950 | Tari Remo mulai dipentaskan di Jombang.\n1971 | ...',
      hint: 'Satu baris satu poin: label | keterangan. Maks. 10 baris.',
    },
    {
      name: 'philosophy',
      label: 'Filosofi / makna',
      as: 'textarea',
      rows: 4,
      defaultValue: philosophyText(c),
      placeholder: '◆ | Gerak kaki | Melambangkan keberanian.\n☀ | Selendang | ...',
      hint: 'Tab Filosofi. Satu baris: simbol | judul | makna (simbol boleh dikosongkan, mis. ◆ ☀ ▲ ●). Maks. 10 baris.',
    },
    {
      name: 'videoLink',
      label: 'Video dari tautan',
      type: 'url',
      maxLength: 500,
      defaultValue: c?.video?.kind === 'link' ? c.video.url : '',
      placeholder: 'https://www.youtube.com/watch?v=… atau https://…/video.mp4',
      hint: 'YouTube/tautan lain dibuka di aplikasi YouTube/browser; tautan langsung ke berkas .mp4/.webm diputar di aplikasi.',
    },
    {
      name: 'videoFile',
      label: c?.video?.kind === 'file' ? 'Ganti berkas video' : 'Atau unggah berkas video',
      type: 'file',
      accept: VIDEO_TYPES.join(','),
      hint: `MP4, WEBM, atau MOV, maks. ${VIDEO_MAX_MB} MB. Diputar langsung di aplikasi mobile.`,
    },
    ...(c?.video
      ? [{ name: 'videoAksi', label: 'Video saat ini', as: 'select' as const, options: [KEEP_VIDEO, REMOVE_VIDEO], defaultValue: KEEP_VIDEO }]
      : []),
    {
      name: 'gambar',
      label: c ? 'Tambah foto sampul baru' : 'Foto sampul',
      type: 'file',
      accept: 'image/jpeg,image/png,image/webp',
      hint: c ? 'Opsional. Foto lain dikelola di panel Foto materi.' : 'Opsional · JPG, PNG, atau WEBP, maks. 5 MB. Foto lain bisa ditambah setelah disimpan.',
    },
  ],
})
