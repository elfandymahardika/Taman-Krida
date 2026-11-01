import { mutate, useQuery } from '../lib/api'
import type { FieldErrors } from '../lib/api'
import type { PhotoKey } from './sample'

/*
 * Data acara (CRUD) disimpan di backend (GET/POST/PUT/PATCH/DELETE /api/events).
 * Validasi di bawah dijalankan di browser untuk umpan balik cepat; backend
 * memeriksa aturan yang sama sebelum menyimpan.
 */

export const VENUES = ['Pendopo Agung TKBJ', 'Panggung Terbuka', 'Gedung Kesenian & Galeri']
export const EVENT_STATUSES = ['Terpublikasi', 'Draf']

export type EventStatus = 'Terpublikasi' | 'Draf'

/** Acara dari GET /api/events. `date` = "YYYY-MM-DD", `start`/`end` = "HH:MM". */
export type Event = {
  id: string
  name: string
  /** Nama singkat untuk kalender & kartu. */
  short: string
  organizer: string
  date: string
  start: string
  end: string
  venue: string
  status: EventStatus
  quota?: number | null
  sold?: number | null
  price?: number | null
  /** Kunci foto di `PHOTOS` (data/sample). */
  photo?: PhotoKey | null
}

/** Isian formulir acara (semua berupa teks dari FormData). */
export type EventInput = Partial<Record<'name' | 'organizer' | 'date' | 'start' | 'end' | 'venue' | 'status' | 'quota', string>>

/* ---------- Format tampilan ---------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const DOW = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']

const toDate = (iso: string) => new Date(`${iso}T00:00:00`)

export const formatDate = (e: Pick<Event, 'date'>, withYear = true) => {
  const d = toDate(e.date)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`
}
export const dayOfWeek = (e: Pick<Event, 'date'>) => DOW[toDate(e.date).getDay()]
export const formatTime = (t: string) => t.replace(':', '.')
export const timeRange = (e: Pick<Event, 'start' | 'end'>, suffix = ' WIB') => `${formatTime(e.start)}–${formatTime(e.end)}${suffix}`
export const sortByDate = (list: Event[]) => [...list].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))

/* ---------- Validasi formulir ---------- */

export function validateEvent(data: EventInput, list: Event[], editingId?: string) {
  const errors: FieldErrors = {}
  const name = (data.name ?? '').trim()
  if (!name) errors.name = 'Nama acara wajib diisi.'
  else if (name.length < 3) errors.name = 'Nama acara minimal 3 karakter.'
  else if (list.some((e) => e.id !== editingId && e.name.toLowerCase() === name.toLowerCase() && e.date === data.date))
    errors.name = 'Acara dengan nama yang sama sudah ada di tanggal ini.'
  if (!(data.organizer ?? '').trim()) errors.organizer = 'Penyelenggara wajib diisi.'
  if (!data.date) errors.date = 'Tanggal wajib dipilih.'
  if (!data.start) errors.start = 'Jam mulai wajib diisi.'
  if (!data.end) errors.end = 'Jam selesai wajib diisi.'
  else if (data.start && data.end <= data.start) errors.end = 'Jam selesai harus setelah jam mulai.'
  if (!VENUES.includes(data.venue)) errors.venue = 'Pilih lokasi yang tersedia.'
  if (data.quota !== '' && data.quota !== undefined) {
    const q = Number(data.quota)
    if (!Number.isInteger(q) || q < 0) errors.quota = 'Kuota harus bilangan bulat ≥ 0.'
  }
  return errors
}

/* ---------- Store (API) ---------- */

/** Semua fungsi mengembalikan Promise dan melempar ApiError bila ditolak backend. */
export const eventStore = {
  add: (data: EventInput) => mutate('/events', { method: 'POST', body: data }),
  update: (id: string, data: EventInput) => mutate(`/events/${id}`, { method: 'PUT', body: data }),
  /** Ubah sebagian: { status }, { quota, price }. */
  patch: (id: string, data: Partial<Pick<Event, 'status' | 'quota' | 'price'>>) => mutate(`/events/${id}`, { method: 'PATCH', body: data }),
  remove: (id: string) => mutate(`/events/${id}`, { method: 'DELETE' }),
  setStatus: (id: string, status: EventStatus) => eventStore.patch(id, { status }),
  reset: () => mutate('/events/reset', { method: 'POST' }),
}

const NONE: Event[] = []

export function useEvents() {
  return useQuery<Event[]>('/events').data ?? NONE
}
