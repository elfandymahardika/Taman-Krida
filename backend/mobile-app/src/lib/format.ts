export const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** 2500000 → "Rp2.500.000" */
export const rupiah = (n: number) => `Rp${Math.round(n).toLocaleString('id-ID')}`;

/** "2026-10-10" → "10 Okt 2026" */
export function shortDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_SHORT[m - 1]} ${y}`;
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

/** 1258291 → "1,2 MB", 344064 → "336 KB" (format label berkas di dashboard admin). */
export function fileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Hari terakhir bulan (1–12). */
export const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** "2026-10" → { y: 2026, m: 10 } atau null bila format salah. */
export function parseMonth(key: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [y, m] = [Number(match[1]), Number(match[2])];
  return m >= 1 && m <= 12 ? { y, m } : null;
}
