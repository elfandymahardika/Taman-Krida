/** Peran staf admin. `key` disimpan di database, `label` untuk tampilan. */
export const ROLES = [
  { key: 'admin', label: 'Administrator utama' },
  { key: 'acara', label: 'Admin Acara' },
  { key: 'keuangan', label: 'Admin Keuangan' },
  { key: 'sewa', label: 'Admin Sewa' },
  { key: 'konten', label: 'Admin Konten' },
] as const;

export type RoleKey = (typeof ROLES)[number]['key'];

export const isRoleKey = (key: unknown): key is RoleKey => ROLES.some((r) => r.key === key);

/** Akun hasil registrasi belum punya peran sampai disetujui Administrator utama. */
export const roleLabel = (key: string | null | undefined) =>
  key ? (ROLES.find((r) => r.key === key)?.label ?? key) : 'Belum ditentukan';

/** Modul panel admin, urutannya sama dengan kolom matriks hak akses. */
export const MODULES = [
  { key: 'events', label: 'Acara & tiket' },
  { key: 'rentals', label: 'Sewa gedung' },
  { key: 'payments', label: 'Transaksi' },
  { key: 'info', label: 'Informasi & komunitas' },
  { key: 'admin', label: 'Pengguna & pengaturan' },
] as const;

export type ModuleKey = (typeof MODULES)[number]['key'];
export type AccessLevel = 'y' | 'p' | 'n';

/** y = boleh mengubah, p = hanya lihat, n = tanpa akses. Satu huruf per modul. */
export const MATRIX: Record<RoleKey, string> = {
  admin: 'yyyyy',
  acara: 'ypnpn',
  keuangan: 'ppynn',
  sewa: 'pypnn',
  konten: 'pnnyn',
};

/** Tingkat akses satu peran pada satu modul. Peran tidak dikenal = 'n'. */
export const accessLevel = (key: string | null | undefined, module: ModuleKey): AccessLevel =>
  ((isRoleKey(key) && MATRIX[key][MODULES.findIndex((m) => m.key === module)]) || 'n') as AccessLevel;

/** Semua tingkat akses satu peran, mis. { events: 'y', rentals: 'p', ... } — dikirim ke frontend. */
export const accessOf = (key: string | null | undefined) =>
  Object.fromEntries(MODULES.map((m) => [m.key, accessLevel(key, m.key)])) as Record<ModuleKey, AccessLevel>;

export const canChange = (key: string | null | undefined, module: ModuleKey) => accessLevel(key, module) === 'y';
export const canView = (key: string | null | undefined, module: ModuleKey) => accessLevel(key, module) !== 'n';

export const moduleLabel = (module: ModuleKey) => MODULES.find((m) => m.key === module)?.label ?? module;

/** Halaman panel → modul. Halaman yang tidak tercantum (Dashboard) terbuka untuk semua staf. */
export const PAGE_MODULE: Record<string, ModuleKey> = {
  '/acara': 'events',
  '/tiket': 'events',
  '/sewa': 'rentals',
  '/transaksi': 'payments',
  '/profil': 'info',
  '/galeri': 'info',
  '/komunitas': 'info',
  '/konten': 'info',
  '/pengguna': 'admin',
  '/pengaturan': 'admin',
};

/** Jenis log aktivitas → modul. `system` tampil untuk semua. */
export const ACTIVITY_MODULE: Record<string, ModuleKey> = {
  payment: 'payments',
  event: 'events',
  rental: 'rentals',
  community: 'info',
  content: 'info',
  gallery: 'info',
  user: 'admin',
};

/** Boleh membuka tautan halaman ini? Tautan kosong atau halaman umum selalu boleh. */
export const canOpen = (key: string | null | undefined, href: string | null | undefined) => {
  const module = href ? PAGE_MODULE[`/${String(href).split(/[/?#]/)[1]}`] : undefined;
  return !module || canView(key, module);
};
