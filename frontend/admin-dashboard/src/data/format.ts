// Format tampilan bersama. Waktu dari API berupa ISO UTC dan ditampilkan dalam WIB.

const TZ = 'Asia/Jakarta'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const timeFmt = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
const dayFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: TZ })
const longDayFmt = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ })

/** 2500000 → "Rp2.500.000" */
export const rupiah = (n: number | null | undefined) => `Rp${Math.round(n ?? 0).toLocaleString('id-ID')}`

/** 2516582 → "2,4 MB" */
export function formatBytes(n: number) {
  const fmt = (v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 1 })
  if (n >= 1024 ** 3) return `${fmt(n / 1024 ** 3)} GB`
  if (n >= 1024 ** 2) return `${fmt(n / 1024 ** 2)} MB`
  return `${Math.max(1, Math.round(n / 1024))} KB`
}

/** "2026-10-10" → "10 Okt 2026" */
export function shortDate(iso: string, withYear = true) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`
}

/** "2026-10" → "Okt 2026", "2026" → "2026" */
export const periodShort = (key: string) => (key.length === 4 ? key : `${MONTHS[Number(key.slice(5)) - 1]} ${key.slice(0, 4)}`)

/** ISO → "09.25 WIB" */
export const wibTime = (iso: string) => `${timeFmt.format(new Date(iso))} WIB`

/** ISO → "2 Okt · 09.25 WIB" */
export const wibDateTime = (iso: string) => `${dayFmt.format(new Date(iso))} · ${wibTime(iso)}`

/** "2026-10-02" → "Jumat, 2 Oktober 2026" */
export const longDate = (isoDate: string) => longDayFmt.format(new Date(`${isoDate}T12:00:00+07:00`))

/** Waktu relatif untuk kejadian < 24 jam, selain itu tanggal & jam. */
export function relativeTime(iso: string, now = Date.now()) {
  const diff = Math.max(0, now - Date.parse(iso)) / 1000
  if (diff < 45) return 'Baru saja'
  if (diff < 3600) return `${Math.round(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.round(diff / 3600)} jam lalu`
  return wibDateTime(iso)
}

/** Rincian singkat pesanan: "2 tiket · 2 Okt 2026" / "Sewa · 10 Okt 2026". */
export const orderDetail = (o: { type: string; qty?: number; serviceDate: string }) =>
  o.type === 'Tiket' ? `${o.qty} tiket · ${shortDate(o.serviceDate)}` : `Sewa · ${shortDate(o.serviceDate)}`

/** Tanggal ISO + n hari (tanpa terpengaruh zona waktu). */
export function addDays(isoDate: string, n: number) {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

/** "2026-10" → "Oktober 2026" */
export const monthLabel = (ym: string) => `${MONTH_NAMES[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`

/** "2026-10" + n bulan → "2026-11" (n boleh negatif). */
export function addMonths(ym: string, n: number) {
  const d = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}

/**
 * Kotak kalender satu bulan, pekan dimulai Senin. `outside` = tanggal bulan sebelum/sesudahnya
 * yang mengisi pekan pertama & terakhir.
 */
export function monthGrid(ym: string) {
  const first = `${ym}-01`
  const offset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0)).getUTCDate()
  const total = Math.ceil((offset + days) / 7) * 7
  return Array.from({ length: total }, (_, i) => {
    const date = addDays(first, i - offset)
    return { date, day: Number(date.slice(8)), outside: !date.startsWith(ym) }
  })
}

export const DOW = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']
export const dowOf = (isoDate: string) => DOW[new Date(`${isoDate}T00:00:00Z`).getUTCDay()]
