# Performa panel admin (CHECK POINT bagian 6)

Panel admin adalah **web dashboard** di balik login, bukan situs publik, jadi fokusnya bukan SEO melainkan kecepatan,
kestabilan tata letak, dan efisiensi data. Target Core Web Vitals:

| Metrik | Target | Yang dijaga di dashboard ini |
|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2,5 dtk | Kartu ringkasan & tabel pertama cepat tampil; foto dioptimasi; foto login pertama di-`preload` |
| **INP** (Interaction to Next Paint) | ≤ 200 ms | Filter, pencarian, dan tombol halaman langsung merespons; pencarian tidak mengirim request per huruf |
| **CLS** (Cumulative Layout Shift) | ≤ 0,1 | Tabel tidak kosong-lalu-terisi saat pindah halaman; ukuran foto tetap (`width`/`height`/`fill`) |

## Yang dikerjakan

### 1. Paginasi di server (`page=1&limit=10`)

Sebelumnya halaman **Transaksi** dan **Tiket** mengambil *semua* pesanan sekaligus (sampai 100–500 baris) lalu
memotongnya di browser; tabel Tiket bahkan menampilkan semuanya tanpa halaman. Sekarang:

- Backend `GET /api/orders?page=1&limit=10` memotong data di MySQL (`LIMIT … OFFSET …`) dan menghitung total dengan
  `COUNT(*)` memakai filter yang sama (`type`, `payment`, `method`, `ticket`, `eventId`, `q`). Respons:
  `{ data: [...10 baris], pagination: { page, limit, total, totalPages } }`. `limit` dibatasi maks. 100.
  Helper bersama: `backend/admin-dashboard/src/lib/pagination.ts`.
- Kartu ringkasan Transaksi kini dihitung di database (`GET /api/orders/stats`), bukan dari daftar yang dipotong —
  sebelumnya angkanya keliru bila transaksi lebih dari 100.
- Tanpa `?page`, endpoint tetap mengembalikan array seperti dulu, jadi widget Beranda (transaksi terbaru) dan versi
  lama dashboard tetap berjalan (penting untuk rilis tanpa downtime, lihat `deploy/README.md`).
- Frontend: `transaksi/components/transaksi.tsx`, `tiket/components/tiket.tsx` memakai `withQuery()` dan tipe
  `Paginated<T>` dari `lib/api.ts`. Yang diterima browser hanya 10 baris per halaman.

Tabel lain (pengguna, konten, komunitas, galeri) jumlah datanya kecil dan tetap dipaginasi di browser.

### 2. Tata letak stabil & interaksi responsif

- `useQuery(key, { keepPrevious: true })`: saat pindah halaman/ganti filter, baris lama tetap tampil sampai data baru
  tiba (ditandai `aria-busy`), sehingga tabel tidak berkedip kosong lalu "melompat" → menjaga **CLS**.
- `useDebouncedValue()`: kotak pencarian baru mengirim permintaan 300 ms setelah pengguna berhenti mengetik → input
  tetap ringan (**INP**) dan server tidak dibanjiri request.
- Bila data berkurang (mis. setelah verifikasi) sehingga halaman aktif melewati halaman terakhir, tabel otomatis
  pindah ke halaman terakhir yang ada.

### 3. Optimasi aset & gambar (`<Image/>` + `sizes`)

- Semua gambar memakai `next/image`. Foto login pertama memakai `preload` (elemen LCP halaman login).
- Komponen `Photo` (`components/ui.tsx`) kini memberi `sizes` sesuai lebar kartu (thumbnail 66 px tidak lagi diunduh
  selebar 480 px).
- Foto galeri **unggahan admin** sebelumnya `unoptimized` (berkas asli bisa sampai 25 MB). Sekarang dioptimasi
  Next.js menjadi AVIF/WebP seukuran tampilan. `next.config.mjs` hanya mengizinkan path `/assets/**` dan
  `/uploads/**` tanpa query string (`images.localPatterns`); path lain ditolak 400.

Hasil ukur (build produksi, foto 556 KB PNG sebagai unggahan galeri, thumbnail `w=256`):

| | Ukuran |
|---|---|
| Berkas asli | 556 KB (PNG) |
| Lewat `<Image/>` | **6 KB** (AVIF) |

### 4. Pemantauan Core Web Vitals pengguna sungguhan

`components/webvitals.tsx` (dipasang di `app/layout.tsx`) memakai `useReportWebVitals` dan mengirim LCP, INP, CLS,
FCP, TTFB ke `POST /api/vitals` dengan `navigator.sendBeacon`. Route handler `app/api/vitals/route.ts` memvalidasi
laporan (Zod, maks. 2 KB) lalu mencatat satu baris JSON di log server; nilai `poor` dicatat sebagai `warn`:

```json
{"level":"info","msg":"web-vitals","metric":"LCP","value":900,"rating":"good","path":"/login","id":"v5-1"}
```

Di produksi: `docker compose logs dashboard | grep web-vitals`.

### 5. Analisis bundle (`npx next analyze`)

```bash
npm run analyze          # UI interaktif (treemap, filter per route, rantai import)
npm run analyze:output   # hanya tulis hasil ke .next/diagnostics/analyze
```

Hasil (Next.js 16.4, Turbopack) — JavaScript yang benar-benar dimuat tiap halaman di build produksi:

| Halaman | Berkas JS | Ukuran (gzip) |
|---|---|---|
| `/login` | 5 | 167 KB |
| `/` Beranda | 12 | 212 KB |
| `/transaksi` | 12 | 205 KB |
| `/tiket` | 12 | 206 KB |
| `/catatan` | 13 | 233 KB |

Library terbesar di sisi client: `next` + React (runtime framework), lalu kode proyek sendiri, `zod`
(validasi formulir di browser, dipakai sengaja sesuai bagian Auth & Form Validation), dan `lucide-react` (sudah
*tree-shaken*, ±14 KB untuk ikon yang dipakai saja). **Tidak ada library berat** seperti library grafik atau
tanggal — grafik penjualan digambar dengan CSS/SVG sendiri. Kandidat penghematan bila diperlukan nanti: `zod/mini`
di formulir client (halaman Catatan paling besar karena formulir + Zod).

## Cara menguji performa (wajib mode produksi)

Jangan mengukur dengan `npm run dev` (tanpa minify, ada overlay & HMR). Langkahnya:

```bash
cd frontend/admin-dashboard
npm run build
npm run start            # atau: npm run start:standalone (sama seperti di Docker)
```

Lalu buka Chrome → DevTools → **Lighthouse** → mode *Navigation*, perangkat *Desktop*, kategori *Performance* →
*Analyze page load* untuk `/login`, `/`, `/transaksi`, dan `/tiket` (login dulu di tab yang sama).
Atau lewat terminal:

```bash
npx lighthouse http://localhost:3000/login --preset=desktop --only-categories=performance --view
```

Catat skor, LCP, CLS, dan TBT (pengganti INP di uji lab) ke tabel di bawah.

| Halaman | Skor | LCP | CLS | TBT |
|---|---|---|---|---|
| `/login` | | | | |
| `/` | | | | |
| `/transaksi` | | | | |
| `/tiket` | | | | |
