import { useSyncExternalStore } from 'react'

/*
 * Data acara (CRUD) disimpan di localStorage browser agar perubahan
 * tetap ada setelah halaman dimuat ulang. Tidak memakai database.
 */

const STORAGE_KEY = 'tkbj.events.v1'

export const VENUES = ['Pendopo Agung TKBJ', 'Panggung Terbuka', 'Gedung Kesenian & Galeri']
export const EVENT_STATUSES = ['Terpublikasi', 'Draf']

const SEED = [
  { id: 'wayang', name: 'Pagelaran Wayang Kulit', short: 'Wayang Kulit', organizer: "Paguyuban Wayang 'Wahyu Budoyo'", date: '2026-10-02', start: '19:00', end: '23:00', venue: 'Pendopo Agung TKBJ', status: 'Terpublikasi', sold: 210, quota: 300, photo: 'wayang' },
  { id: 'topeng', name: 'Tari Topeng Malangan', short: 'Tari Topeng', organizer: 'Sanggar Tari Mekar Sari', date: '2026-10-03', start: '16:00', end: '18:00', venue: 'Panggung Terbuka', status: 'Terpublikasi', sold: 176, quota: 300, photo: 'topeng' },
  { id: 'ketoprak', name: 'Ketoprak Guyub Rukun', short: 'Ketoprak', organizer: "Komunitas Ketoprak 'Guyub Rukun'", date: '2026-10-04', start: '19:00', end: '21:00', venue: 'Pendopo Agung TKBJ', status: 'Terpublikasi', sold: 100, quota: 200, photo: 'ketoprak' },
  { id: 'karawitan', name: 'Latihan Karawitan Bersama', short: 'Latihan karawitan', organizer: 'Paguyuban Sekar Laras', date: '2026-10-07', start: '15:00', end: '17:00', venue: 'Pendopo Agung TKBJ', status: 'Terpublikasi' },
  { id: 'ludruk', name: 'Ludruk Malangan', short: 'Ludruk Malangan', organizer: 'Kelompok Ludruk Karya Budaya', date: '2026-10-09', start: '19:00', end: '21:00', venue: 'Panggung Terbuka', status: 'Terpublikasi' },
  { id: 'kriya', name: 'Pameran Kriya Jawa Timur', short: 'Pameran kriya', organizer: 'Dekranasda Jatim', date: '2026-10-12', start: '09:00', end: '16:00', venue: 'Gedung Kesenian & Galeri', status: 'Terpublikasi' },
  { id: 'tradisi', name: 'Pentas Tari Tradisi', short: 'Tari tradisi', organizer: 'Sanggar Sekar Arum', date: '2026-10-16', start: '16:00', end: '18:00', venue: 'Panggung Terbuka', status: 'Terpublikasi' },
  { id: 'jaranan', name: 'Jaranan Dor', short: 'Jaranan Dor', organizer: 'Paguyuban Jaranan Turonggo', date: '2026-10-18', start: '15:00', end: '17:00', venue: 'Panggung Terbuka', status: 'Terpublikasi' },
  { id: 'batik', name: 'Lokakarya Batik Malangan', short: 'Lokakarya batik', organizer: 'Komunitas Kriya Tunas', date: '2026-10-21', start: '10:00', end: '13:00', venue: 'Gedung Kesenian & Galeri', status: 'Terpublikasi' },
  { id: 'festival', name: 'Festival Seni Tradisi', short: 'Festival seni', organizer: 'Tim program TKBJ', date: '2026-10-24', start: '09:00', end: '17:00', venue: 'Panggung Terbuka', status: 'Draf' },
  { id: 'diskusi', name: 'Diskusi Budaya Panji', short: 'Diskusi budaya', organizer: 'Tim program TKBJ', date: '2026-10-28', start: '13:00', end: '15:00', venue: 'Gedung Kesenian & Galeri', status: 'Draf' },
  { id: 'pentas', name: 'Pentas Akhir Bulan', short: 'Pentas akhir bulan', organizer: 'Tim program TKBJ', date: '2026-10-31', start: '19:00', end: '22:00', venue: 'Pendopo Agung TKBJ', status: 'Draf' },
]

/* ---------- Format tampilan ---------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const DOW = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']

const toDate = (iso) => new Date(`${iso}T00:00:00`)

/** Tanggal di bulan Oktober 2026 (bulan kalender contoh), selain itu null. */
export const octDay = (e) => (e.date.startsWith('2026-10') ? Number(e.date.slice(8)) : null)
export const formatDate = (e, withYear = true) => {
  const d = toDate(e.date)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`
}
export const dayOfWeek = (e) => DOW[toDate(e.date).getDay()]
export const formatTime = (t) => t.replace(':', '.')
export const timeRange = (e, suffix = ' WIB') => `${formatTime(e.start)}–${formatTime(e.end)}${suffix}`
export const sortByDate = (list) => [...list].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))

/* ---------- Validasi formulir ---------- */

export function validateEvent(data, list, editingId) {
  const errors = {}
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

/* ---------- Store ---------- */

function load() {
  // Di server (render awal Next.js) tidak ada localStorage.
  if (typeof window === 'undefined') return SEED
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // localStorage tidak tersedia atau rusak → pakai data contoh.
  }
  return SEED
}

let events = load()
const listeners = new Set()

function commit(next) {
  events = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Abaikan: data tetap berjalan di memori.
  }
  listeners.forEach((l) => l())
}

const subscribe = (l) => (listeners.add(l), () => listeners.delete(l))

export const eventStore = {
  add(data) {
    const id = `e${Date.now()}`
    const e = normalize(data)
    commit([...events, { ...e, id, short: e.name, sold: e.quota !== undefined ? 0 : undefined }])
    return id
  },
  update(id, data) {
    commit(
      events.map((e) => {
        if (e.id !== id) return e
        const next = normalize(data)
        return {
          ...e,
          ...next,
          short: next.name === e.name ? e.short : next.name,
          sold: next.quota !== undefined ? Math.min(e.sold ?? 0, next.quota) : undefined,
        }
      }),
    )
  },
  remove(id) {
    commit(events.filter((e) => e.id !== id))
  },
  setStatus(id, status) {
    commit(events.map((e) => (e.id === id ? { ...e, status } : e)))
  },
  reset() {
    commit(SEED)
  },
}

function normalize(data) {
  const quota = data.quota === '' || data.quota === undefined ? undefined : Number(data.quota)
  return {
    name: data.name.trim(),
    organizer: data.organizer.trim(),
    date: data.date,
    start: data.start,
    end: data.end,
    venue: data.venue,
    status: data.status ?? 'Draf',
    quota,
  }
}

export function useEvents() {
  // Server memakai data contoh; data dari localStorage dipakai setelah hidrasi.
  return useSyncExternalStore(subscribe, () => events, () => SEED)
}
