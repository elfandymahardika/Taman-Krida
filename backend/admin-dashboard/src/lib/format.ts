export const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** 2500000 → "Rp2.500.000" */
export const rupiah = (n: number) => `Rp${Math.round(n).toLocaleString('id-ID')}`;

/** "2026-10-10" → "10 Okt 2026" */
export function shortDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_SHORT[m - 1]} ${y}`;
}

export const round1 = (n: number) => Math.round(n * 10) / 10;

const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export interface Period {
  key: string;
  label: string;
  from: string;
  to: string;
}

/**
 * Periode ringkasan: "2026-10" (satu bulan) atau "2026" (satu tahun).
 * Mengembalikan rentang tanggal inklusif dan label tampilan.
 */
export function parsePeriod(key: string): Period | null {
  if (/^\d{4}$/.test(key)) return { key, label: `Tahun ${key}`, from: `${key}-01-01`, to: `${key}-12-31` };
  const match = /^(\d{4})-(\d{2})$/.exec(key ?? '');
  if (!match) return null;
  const [y, m] = [Number(match[1]), Number(match[2])];
  if (m < 1 || m > 12) return null;
  const end = lastDay(y, m);
  return { key, label: `1–${end} ${MONTH_NAMES[m - 1]} ${y}`, from: `${key}-01`, to: `${key}-${end}` };
}

/** DATETIME MySQL (UTC, "2026-10-02 02:30:00.000") → ISO "2026-10-02T02:30:00.000Z". */
export function iso(value: string): string;
export function iso(value: string | null | undefined): string | undefined;
export function iso(value: string | null | undefined) {
  if (!value) return undefined;
  return new Date(`${value.replace(' ', 'T')}Z`).toISOString();
}

/** TIME MySQL "19:00:00" → "19:00". */
export const hhmm = (value: string) => value.slice(0, 5);
