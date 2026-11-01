# Panel Administrator TKBJ — Dashboard Web

Prototipe **Dashboard Web untuk administrator** Taman Krida Budaya Jawa Timur (TKBJ), dibuat untuk tugas Ujian Tengah Semester (UTS).

TKBJ adalah pusat seni dan budaya Jawa Timur di Kota Malang. Sistem ini terdiri dari dua antarmuka:

- **Dashboard Web (repository ini):** dipakai admin untuk mengelola acara, tiket pertunjukan, sewa gedung, pembayaran, konten, dan komunitas seni.
- **Mobile Application:** dipakai pengunjung untuk melihat agenda, membeli tiket, dan mengajukan sewa gedung.

Desain antarmuka mengikuti rancangan Figma tim: **[Highfi-Taman-Krida](https://www.figma.com/design/arjM0e1ApzkZ58oERTzCa8/Highfi-Taman-Krida)**. Data diambil dari **backend** [`backend/admin-dashboard`](../../backend/admin-dashboard) (Express + TypeScript + MySQL) yang berisi **data contoh**. Token sesi login disimpan di **cookie HttpOnly** (tidak bisa dibaca JavaScript); browser memanggil backend lewat proxy same-origin `/api/be`.

---

## Pemenuhan ketentuan UTS

| Ketentuan | Implementasi |
|---|---|
| Halaman login | `/login`: login ke backend (JWT), validasi username/password, pesan error, akun nonaktif ditolak, dikunci sementara setelah terlalu banyak percobaan gagal. Halaman admin terkunci sebelum login. Ada tombol **Keluar** di menu akun. |
| Dashboard utama | `/`: ringkasan metrik, agenda terdekat, antrean tugas, transaksi terbaru, log aktivitas. |
| Tampilan data tabel / kartu | Tabel pesanan, kartu metrik, kartu inventori tiket, kartu galeri, dan lainnya di setiap halaman. |
| Halaman pengelolaan data | **Acara & kalender** (`/acara`): **tambah, edit, hapus**, terbitkan/tarik publikasi, cari, filter, dan paginasi. Data tersimpan di database MySQL lewat backend. |
| Navigasi antarhalaman | Sidebar dengan 11 halaman, breadcrumb, dan tautan antarbagian (mis. "Kelola kalender →"). |
| Form menerima input + validasi | Login (wajib isi, format username, minimal 6 karakter, akun salah). Form acara (wajib isi, nama minimal 3 karakter, nama duplikat di tanggal yang sama, jam selesai harus setelah jam mulai, kuota bilangan bulat ≥ 0). Form inventori tiket (kuota tidak boleh kurang dari tiket terjual). |
| Data & penyimpanan | Acara, transaksi, sewa, komunitas, keuangan, log aktivitas, dan notifikasi tersimpan di database backend. Ada tombol **Pulihkan data contoh** (acara) dan `npm run seed` di backend (semua data). |
| Interaktivitas dashboard | Periode ringkasan bisa dipilih (dihitung ulang server) dengan perbandingan periode sebelumnya, kartu metrik bisa diklik, angka beranimasi, strip tanggal agenda, verifikasi pembayaran langsung dari tabel, pencarian tabel, log aktivitas dengan filter + muat lebih banyak + sorotan entri baru, refresh otomatis, pencarian global, notifikasi, dan unduh CSV. |
| Rancangan fitur AI | Lihat bagian [Rancangan Fitur AI](#rancangan-fitur-ai). Pratinjaunya juga tampil di halaman Transaksi. |

---

## Tugas #9 — Autentikasi & Otorisasi

Modul autentikasi (registrasi, login, logout) dan otorisasi berbasis peran (RBAC) terintegrasi langsung di panel ini dan di backend [`backend/admin-dashboard`](../../backend/admin-dashboard).

| Ketentuan | Implementasi |
|---|---|
| **1a. Registrasi** | Halaman `/register` + `POST /api/auth/register`. Validasi di browser dan server (nama, username unik, email unik, password ≥ 8 karakter berisi huruf & angka, konfirmasi password). Akun baru berstatus **Menunggu persetujuan** tanpa peran, lalu disetujui/ditolak Administrator utama di halaman **Pengguna & peran** (sekaligus memilih perannya). |
| **1b. Login** | Halaman `/login` + `POST /api/auth/login`: validasi kredensial, pesan sama untuk username/password salah, kunci sementara setelah beberapa percobaan gagal, akun yang menunggu persetujuan/ditolak/nonaktif ditolak **403**. |
| **1c. Logout** | Menu akun → **Keluar** (Server Action `logoutAction`) memanggil `POST /api/auth/logout`: sesi token **dicabut di server** (token yang sama langsung ditolak 401), lalu cookie sesi dihapus. |
| **2a. Hashing password** | **bcrypt** (`bcryptjs`, cost 10, salt acak). Tidak ada password teks asli di database. Hash lama otomatis diganti ke bcrypt. |
| **Manajemen sesi** | **JWT** + tabel `sessions` di database (`jti`), masa berlaku mengikuti *Pengaturan → Durasi sesi*. Token disimpan di cookie `tkbj_session` (HttpOnly, SameSite=Lax, Secure di HTTPS/localhost). Profil & hak akses dibaca ulang dari `GET /api/auth/me` oleh DAL setiap halaman panel dirender. |
| **3a. Minimal 2 peran** | 5 peran: Administrator utama, Admin Acara, Admin Keuangan, Admin Sewa, Admin Konten (+ status *Menunggu persetujuan* untuk pendaftar). |
| **3b. Guard UI** | `proxy.ts` (tanpa cookie → `/login?from=…`) + DAL `getCurrentUser()` di layout admin (sesi tidak sah → `/login`). `components/layout/layout.tsx` memeriksa modul halaman: tanpa akses → halaman **403 Akses ditolak**, hanya lihat → penanda *Mode lihat saja*. Sidebar, kartu dashboard, tombol header, hasil pencarian, dan notifikasi hanya untuk modul yang boleh diakses. |
| **3b. Guard server** | Middleware `authMiddleware` (401), `requireView` (modul tanpa akses → **403**), `requireAccess` (aksi ubah tanpa hak → **403**). Lihat README backend. |
| **4a. Akun dummy per peran** | Tabel di bawah; juga tampil di halaman login (klik untuk mengisi form). |
| Pengujian | `npm test` di backend: 33 tes integrasi, termasuk registrasi, persetujuan, logout, bcrypt, RBAC per peran, catatan anti-IDOR, dan upload berkas. |

### Akun dummy per peran

| Username | Password | Peran | Bisa membuka |
|---|---|---|---|
| `admin` | `admin123` | Administrator utama | Semua halaman (ubah) |
| `nur.aini` | `tkbj2026` | Admin Acara | Acara & Tiket (ubah); Sewa, Profil, Galeri, Komunitas, Konten (lihat) |
| `keuangan` | `keuangan123` | Admin Keuangan | Transaksi (ubah); Acara, Tiket, Sewa (lihat) |
| `rina.s` | `tkbj2026` | Admin Sewa | Sewa (ubah); Acara, Tiket, Transaksi (lihat) |
| `siti.rahma` | `tkbj2026` | Admin Konten | Profil, Galeri, Komunitas, Konten (ubah); Acara, Tiket (lihat) |
| `dimas.p` | `tkbj2026` | — (menunggu persetujuan) | Tidak bisa login sampai disetujui admin |

Dashboard terbuka untuk semua peran, isinya menyesuaikan hak akses. Halaman **Pengguna & peran** dan **Pengaturan** hanya untuk Administrator utama.

### Panduan uji coba (untuk dosen / asisten)

1. Jalankan backend lalu dashboard (lihat [Panduan menjalankan aplikasi](#panduan-menjalankan-aplikasi)).
2. **Registrasi:** buka `/register`, coba kirim form kosong/tidak valid (muncul pesan per kolom), lalu daftar dengan data valid → muncul *Pendaftaran terkirim*.
3. **Login sebelum disetujui:** login dengan akun baru tadi → ditolak *"Akun Anda masih menunggu persetujuan Administrator utama."*
4. **Persetujuan:** login sebagai `admin` / `admin123` → **Pengguna & peran** → pilih pendaftar → pilih peran (mis. Admin Konten) → **Setujui & aktifkan**. Keluar.
5. **Otorisasi:** login dengan akun baru → sidebar hanya berisi menu sesuai peran. Buka `/transaksi` lewat address bar → **403 Akses ditolak**. Buka `/acara` → *Mode lihat saja*; klik **Tarik**/**Hapus** di tabel → server menolak (403).
6. **Logout:** menu akun (kanan atas) → **Keluar**. Tombol *Back* atau membuka `/` lagi → kembali ke `/login`; token lama juga sudah ditolak server.
7. Ulangi langkah 5 dengan akun dummy lain untuk melihat perbedaan tiap peran.
8. **Hash password:** buka phpMyAdmin (http://localhost/phpmyadmin) → database `tkbj_admin` → tabel `users`, kolom `password_hash` berisi `$2b$10$…` (bcrypt). Atau jalankan `npm test` di backend.

### Alur singkat

```
/register ──► akun "Menunggu persetujuan" (tanpa peran) ──► admin: Setujui + pilih peran ──► akun "Aktif"
/login    ──► cek bcrypt ──► cek status ──► JWT + baris sessions ──► user.access (hak akses per modul)
setiap permintaan API ──► authMiddleware (401) ──► requireView / requireAccess (403)
setiap halaman panel  ──► proxy.ts (cookie?) ──► DAL getCurrentUser() (→ /login) ──► guard modul di layout (403 / mode lihat saja)
Keluar    ──► logoutAction ──► POST /api/auth/logout (sesi dicabut) ──► hapus cookie ──► /login
```

---

## Modul 02 & 03 — Ruang kerja staf

Mengikuti [PBL Guide](https://pbl-guidlines.vercel.app/docs/02-form-handling) Modul 02 (Form, Auth DAL & Mutasi Data) dan Modul 03 (File Upload & Cloud Storage). Perencanaan data & hak aksesnya ada di [`docs/fitur-dan-akses.md`](../../docs/fitur-dan-akses.md). Dua menu baru di grup **Ruang kerja** dapat dibuka semua staf, dan datanya dibatasi per pemilik.

**Catatan staf (`/catatan`) — Modul 02**

| Langkah panduan | Implementasi |
|---|---|
| 2–3. Sistem login & halaman login | Login tetap divalidasi backend Express (bcrypt + JWT, Modul 01). Form login/daftar memakai **Server Action** (`app/(auth)/actions.ts`) + `useActionState`; token disimpan di cookie **HttpOnly**. Better Auth tidak dipakai agar tidak ada dua sistem login. |
| 4. DAL & pagar proxy | `src/lib/dal.ts`: `getCurrentUser()` (React `cache()`, cek sesi ke backend, redirect `/login`). `src/proxy.ts` (nama baru `middleware.ts` di Next.js 16) = pagar kasar berbasis cookie. |
| 5. Schema bersama | `src/lib/validation/auth.ts` (Zod: login, registrasi) & `src/lib/schemas.ts` (catatan). |
| 6–7. Server Action + Zod | `app/(dashboard)/catatan/actions.ts`: cek login → cek role → `safeParse` (error per kolom, tidak `throw`) → mutasi. |
| 8–10. Form & error | `components/formcatatan.tsx`: `useActionState` (`state`, `formAction`, `isPending`), error tampil di bawah kolomnya, isian dipertahankan saat gagal. |
| 11–12. Mutasi & revalidasi | userId pemilik diambil dari sesi oleh backend, tidak pernah dari form. `revalidatePath('/catatan')` setelah setiap mutasi. |
| 14. Update/Delete anti-IDOR | `updateNoteAction.bind(null, id)`; backend memakai `WHERE id = ? AND user_id = ?`, catatan orang lain dibalas **404**. |
| 15. Aksi khusus admin | **Arsipkan** (`archiveNoteAdminAction`) mengecek `roleKey === 'admin'` dan membalas `FORBIDDEN` untuk peran lain (backend juga 403). Administrator utama punya tab **Semua staf** (supervisi). |
| 16. Optimistic UI | `components/daftarcatatan.tsx`: hapus & arsip langsung terlihat lewat `useOptimistic`, lalu dikembalikan otomatis bila server menolak. |

**Dokumen (`/dokumen`) — Modul 03**

| Langkah panduan | Implementasi |
|---|---|
| 1. Database vs storage | Tabel `documents` hanya menyimpan metadata. File fisik ada di `backend/admin-dashboard/uploads/` atau Vercel Blob. |
| 2–5. Backend | Multer `memoryStorage`, batas 5 MB, whitelist JPG/PNG/WEBP/PDF + cek *magic number*. Storage service dual-mode, rollback bila insert database gagal, hapus anti-IDOR. Rincian ada di README backend. |
| 6. Drag & drop | `components/areaunggah.tsx`: validasi ukuran & tipe di browser sebelum dikirim. |
| 7. Progres nyata | FormData dikirim lewat `XMLHttpRequest` (`xhr.upload.onprogress`) → bilah progres 0–100%, bisa dibatalkan. |
| 8. Kartu & pratinjau | `kartudokumen.tsx` (ukuran KB/MB, jenis, tanggal, pemilik) dan `pratinjaudokumen.tsx` (gambar langsung, PDF dalam iframe). |
| 9. Hapus | Konfirmasi modal → `DELETE /api/upload/:id` → daftar langsung diperbarui. |

**Uji coba singkat:** login `rina.s` → **Catatan staf**: kirim judul 2 huruf (muncul error di bawah kolom), simpan catatan, ubah, lalu hapus (item hilang seketika). Login `admin` → tab **Semua staf** → **Arsipkan** catatan Rina. Kemudian **Dokumen**: tarik file PDF/JPG ≤ 5 MB ke area unggah, klik **Lihat**, lalu **Hapus**. File > 5 MB atau `.txt` ditolak. Cookie `tkbj_session` di DevTools → Application → Cookies bertanda HttpOnly, Secure, SameSite=Lax.

---

## Panduan menjalankan aplikasi

Prasyarat: **Node.js 20 atau lebih baru** (diuji dengan Node 24), npm, dan **MySQL** yang menyala (mis. XAMPP).

```bash
# 1. Jalankan backend lebih dulu (lihat backend/admin-dashboard/README.md)
cd backend/admin-dashboard
npm install
cp .env.example .env       # Windows: copy .env.example .env
npm run migrate            # buat database & tabel MySQL
npm run seed               # isi data contoh
npm run dev                # http://localhost:5000/api

# 2. Di terminal lain, jalankan dashboard
cd frontend/admin-dashboard
npm install
npm run dev
```

Buka http://localhost:3000, lalu login memakai akun demo. Alamat backend diatur lewat `NEXT_PUBLIC_API_URL` di `.env.local` (salin dari `.env.example`; bawaan `http://localhost:5000/api`). Untuk memakai backend rekan tim via Ngrok, isi `NEXT_PUBLIC_API_URL=https://xxxxx.ngrok-free.app/api` lalu restart `npm run dev`. Bila backend mati, halaman menampilkan pesan "Data belum bisa dimuat" dengan tombol **Coba lagi**.

### Build produksi

```bash
npm run build     # hasil di folder .next/
npm run start     # menjalankan hasil build di http://localhost:3000
```

Semua halaman di-*prerender* sebagai halaman statis oleh Next.js. Cara termudah untuk online adalah mengimpor repository ini ke [Vercel](https://vercel.com) (pilih folder `admin-dashboard` sebagai *Root Directory*).

---

## Library / package yang digunakan

| Package | Versi | Kegunaan |
|---|---|---|
| [next](https://nextjs.org) | 16.4.0 | Framework React: routing berbasis folder (App Router), build, dev server, optimasi gambar dan font |
| [react](https://react.dev) | 19.3.0 | Library UI berbasis komponen |
| react-dom | 19.3.0 | Render React ke browser |
| [lucide-react](https://lucide.dev) | 1.52.0 | Ikon, sama dengan ikon pada desain Figma |
| [oxlint](https://oxc.rs) | 1.87.0 | Linter (`npm run lint`), dengan plugin aturan Next.js |
| [typescript](https://www.typescriptlang.org) | 7.0.2 | Pemeriksaan tipe (`.ts` / `.tsx`), dijalankan otomatis saat `next build` |

Font Inter, Playfair Display, dan Poppins dimuat lewat `next/font/google`. Foto memakai `next/image`. Styling memakai CSS biasa dengan design token (`src/index.css`), tanpa framework CSS.

---

## Screenshot

| Login | Validasi login |
|---|---|
| ![Login](docs/screenshots/01-login.png) | ![Validasi login](docs/screenshots/02-login-validasi.png) |

**Autentikasi & otorisasi (Tugas #9)**

| Registrasi | Validasi registrasi |
|---|---|
| ![Registrasi](docs/screenshots/13-register.png) | ![Validasi registrasi](docs/screenshots/12-register-validasi.png) |

| Pendaftaran terkirim | Login ditolak: menunggu persetujuan |
|---|---|
| ![Pendaftaran terkirim](docs/screenshots/14-register-berhasil.png) | ![Menunggu persetujuan](docs/screenshots/15-login-menunggu-persetujuan.png) |

| Admin menyetujui pendaftar & memilih peran | Akun demo per peran |
|---|---|
| ![Persetujuan](docs/screenshots/16-persetujuan-pendaftar.png) | ![Akun demo](docs/screenshots/20-login-akun-demo.png) |

| 403 Akses ditolak (Admin Konten membuka /transaksi) | Mode lihat saja (Admin Konten di /acara) |
|---|---|
| ![403](docs/screenshots/18-akses-ditolak-403.png) | ![Lihat saja](docs/screenshots/19-mode-lihat-saja.png) |

**Dashboard Admin Konten** — menu, kartu, dan grafik menyesuaikan peran

![Dashboard Admin Konten](docs/screenshots/17-dashboard-admin-konten.png)

**Dashboard utama**

![Dashboard](docs/screenshots/03-dashboard.png)

**Pengelolaan data acara (tambah, edit, hapus)**

![Kelola acara](docs/screenshots/04-kelola-acara.png)

| Validasi form tambah acara | Konfirmasi hapus |
|---|---|
| ![Validasi form](docs/screenshots/05-validasi-form.png) | ![Konfirmasi hapus](docs/screenshots/06-konfirmasi-hapus.png) |

**Transaksi & pembayaran, dengan pratinjau rancangan fitur AI**

![Transaksi](docs/screenshots/09-transaksi-rancangan-ai.png)

<details>
<summary>Screenshot halaman lain</summary>

![Tiket](docs/screenshots/07-tiket.png)
![Sewa gedung](docs/screenshots/08-sewa-gedung.png)
![Pengguna](docs/screenshots/10-pengguna.png)

**Tampilan mobile (390px)**

<img src="docs/screenshots/11-mobile.png" width="320" alt="Tampilan mobile" />

</details>

---

## Daftar halaman

| Rute | Halaman | Isi utama |
|---|---|---|
| `/login` | Login | Login ke backend dengan validasi, akun demo per peran |
| `/register` | Daftar akun | Registrasi staf (menunggu persetujuan admin) |
| `/` | Dashboard | Metrik, agenda, antrean tindak lanjut, transaksi, aktivitas |
| `/acara` | Acara & kalender | **CRUD acara**, kalender bulanan, filter |
| `/tiket` | Tiket pertunjukan | Inventori tiket per acara, pesanan, verifikasi |
| `/sewa` | Sewa gedung | Jadwal ketersediaan fasilitas, tinjau permintaan sewa |
| `/transaksi` | Transaksi & pembayaran | Daftar pembayaran, antrean verifikasi, rancangan AI |
| `/profil` | Profil & denah | Editor profil dengan pratinjau langsung, denah area |
| `/galeri` | Virtual galeri | Koleksi media, metadata, unggahan |
| `/komunitas` | Direktori komunitas | Daftar komunitas, persetujuan pendaftaran |
| `/konten` | Konten | Daftar konten, editor banner beranda |
| `/catatan` | Catatan staf | Catatan pribadi staf (Server Action, Zod, anti-IDOR, Optimistic UI); admin: supervisi & arsip |
| `/dokumen` | Dokumen | Unggah drag & drop dengan progres, pratinjau gambar/PDF, hapus (milik sendiri; admin: semua) |
| `/pengguna` | Pengguna & peran admin | Akun staf, **persetujuan pendaftaran**, matriks hak akses |
| `/pengaturan` | Pengaturan | Notifikasi, pemesanan, pembayaran, keamanan |

---

## Rancangan Fitur AI

> Fitur ini **belum diimplementasikan**. Bagian ini menjelaskan rencana pengembangan tahap berikutnya.

### Asisten Verifikasi Bukti Pembayaran

**Masalah.** Pembayaran tiket dan sewa gedung dilakukan lewat transfer bank. Admin keuangan harus mencocokkan setiap foto bukti transfer dengan tagihan secara manual: nominal, nama pengirim, dan tanggal. Pada data contoh ada **8 pembayaran** yang menunggu verifikasi. Proses ini lambat dan rawan salah, sementara tiket baru terbit setelah pembayaran dinyatakan lunas.

**Solusi.** AI membaca foto bukti transfer yang diunggah pengguna dari Mobile App, lalu memberi **saran keputusan** kepada admin.

**Alur kerja:**

1. Pengguna mengunggah foto bukti transfer di Mobile App.
2. **OCR / vision model** mengekstrak teks: nama bank, nominal, nama pengirim, tanggal dan jam, nomor referensi.
3. **Pencocokan aturan** membandingkan hasil ekstraksi dengan tagihan (nomor pesanan, nominal, nama pemesan, batas waktu bayar).
4. **Deteksi anomali** menandai bukti yang dicurigai diedit, bukti yang sama dipakai ulang (hash gambar), atau nominal yang tidak wajar.
5. Dashboard menampilkan **skor keyakinan** dan alasannya, misalnya *"Cocok 96% · nominal & nama sesuai"* atau *"Perlu dicek: tanggal transfer melewati batas bayar"*.
6. Admin tetap mengambil **keputusan akhir** (Verifikasi lunas / Minta ulang). Keputusan admin menjadi data latih untuk perbaikan model.

**Input dan output:**

| Input | Output |
|---|---|
| Foto bukti transfer (JPG/PNG/PDF) | Data terstruktur: bank, nominal, pengirim, tanggal, no. referensi |
| Data tagihan dari sistem | Status saran: *Cocok* / *Perlu dicek* / *Tidak cocok* |
| Riwayat bukti sebelumnya | Skor keyakinan 0–100% beserta alasan |

**Rencana teknologi:** layanan OCR atau vision-language model (misalnya model multimodal melalui API) dan backend sederhana (Node.js/Express atau Firebase Functions) sebagai penghubung. Aturan pencocokan ditulis sebagai kode biasa agar mudah diaudit.

**Manfaat:** mempercepat antrean verifikasi, mengurangi salah input, tiket lebih cepat terbit, dan ada jejak alasan untuk setiap keputusan.

**Batasan dan etika:** AI hanya memberi saran, bukan keputusan otomatis. Data bukti transfer bersifat pribadi, jadi disimpan terbatas dan aksesnya dibatasi untuk Admin Keuangan sesuai matriks peran.

Pratinjau tampilannya ada di halaman **Transaksi & pembayaran**, pada panel "Verifikasi pembayaran".

---

## Struktur proyek

```
├── docs/screenshots/      screenshot untuk README
├── public/                favicon dan logo
├── src/
│   ├── proxy.ts           pagar kasar: halaman panel tanpa cookie sesi → /login?from=…
│   ├── app/               rute Next.js (App Router)
│   │   ├── layout.tsx     layout root: font, metadata, provider modal/toast
│   │   ├── api/be/[...path]/route.ts  proxy API ke backend (cookie HttpOnly → Authorization: Bearer)
│   │   ├── uploads/[...path]/route.ts berkas unggahan dari backend lewat domain frontend
│   │   ├── not-found.tsx  rute tak dikenal → dialihkan ke Dashboard
│   │   ├── (auth)/        halaman autentikasi — route group, tidak menambah segmen URL
│   │   │   ├── actions.ts   Server Action login, registrasi, logout (cookie sesi)
│   │   │   ├── components/hero.tsx  panel foto, dipakai login & register
│   │   │   ├── login/     halaman /login (components/: login, LoginForm)
│   │   │   └── register/  halaman /register (components/: register, RegisterForm)
│   │   └── (dashboard)/   halaman admin; layout.tsx = getCurrentUser() (DAL) + SessionProvider + sidebar/topbar
│   │       ├── (beranda)/     /  (Dashboard) — route group, tidak menambah segmen URL
│   │       ├── acara/         /acara
│   │       │   ├── page.tsx           judul tab (metadata) → <Acara />
│   │       │   └── components/
│   │       │       ├── acara.tsx          komponen utama: state halaman, filter, susunan bagian
│   │       │       ├── hero.tsx           judul halaman + tombol aksi
│   │       │       ├── kalenderacara.tsx  kalender + agenda terpilih
│   │       │       ├── daftaracara.tsx    tabel acara
│   │       │       └── aksiacara.ts       aksi bersama (tambah, edit, hapus, …)
│   │       ├── catatan/       /catatan — page.tsx (Server Component, data via DAL), actions.ts (Server Action),
│   │       │                  components/: catatan, hero, formcatatan (useActionState), daftarcatatan (useOptimistic)
│   │       ├── dokumen/       /dokumen — components/: dokumen, areaunggah, kartudokumen, pratinjaudokumen, jenisdokumen
│   │       └── …              /tiket, /sewa, /transaksi, /profil, dst. (pola yang sama)
│   ├── assets/            foto dari desain Figma (diimpor untuk next/image)
│   ├── index.css          design token & gaya seluruh komponen
│   ├── components/
│   │   ├── site/auth-gate.tsx  ajakan login saat sesi berakhir (CHECK POINT 11)
│   │   ├── layout/        kerangka halaman admin (dipakai src/app/(dashboard)/layout.tsx)
│   │   │   ├── layout.tsx     gabungan sidebar + topbar + isi halaman
│   │   │   ├── menu.ts        daftar menu sidebar (NAV)
│   │   │   ├── sidebar.tsx    logo, menu navigasi, alamat
│   │   │   ├── topbar.tsx     breadcrumb, pencarian, notifikasi, menu akun (logout)
│   │   │   ├── pencarian.tsx  pencarian global
│   │   │   ├── notifikasi.tsx lonceng notifikasi
│   │   │   ├── popover.ts     hook tutup popover (klik di luar / Esc)
│   │   │   └── aksesditolak.tsx  halaman 403 untuk modul di luar hak akses
│   │   ├── akses.tsx      <BolehUbah>, <TombolUnduhLaporan>: tampil sesuai hak akses
│   │   ├── ui.tsx         komponen dasar: Badge, Card, DataTable, Field, dll.
│   │   └── overlay.tsx    modal form (dengan validasi), modal detail, toast
│   ├── lib/
│   │   ├── api.ts         klien REST (lewat /api/be): useQuery, mutate, unggah dengan progres, unduh berkas
│   │   ├── session.tsx    SessionProvider: profil & hak akses dari server (tanpa token)
│   │   ├── dal.ts         Data Access Layer (server-only): getCurrentUser, catatan
│   │   ├── backend.ts     klien backend di server + penerus proxy (server-only)
│   │   ├── schemas.ts     schema Zod bersama (login, registrasi, catatan)
│   │   ├── cookie.ts      nama cookie sesi
│   │   └── access.ts      RBAC di UI: modul per halaman, useAccess()
│   ├── data/
│   │   ├── auth.ts        akun demo + refresh profil dari /auth/me
│   │   ├── events.ts      format & validasi acara, store CRUD lewat API
│   │   ├── finance.ts     format angka juta rupiah
│   │   ├── eventforms.ts  modal formulir & rincian acara (dipakai Dashboard dan Acara)
│   │   ├── format.ts      format rupiah, tanggal, jam WIB, waktu relatif
│   │   └── sample.ts      foto & aset
└── next.config.mjs
```

`src/app/**/page.tsx` adalah *server component* tipis yang mengatur judul tab (`metadata`) lalu merender komponen utama dari folder `components/` di sebelahnya. Setiap halaman dipecah per bagian di folder itu: `hero.tsx` (judul + tombol aksi), `ringkasan*.tsx` (kartu metrik), `daftar*.tsx` (tabel), dan kartu lainnya. Hook `aksi*.ts` / `form*.ts` menampung aksi atau state formulir yang dipakai beberapa bagian. Folder `components/` tidak menjadi rute karena tidak berisi `page.tsx`. Komponen bersama ada di `src/components/`. Hampir semua komponen ini adalah *client component* (`'use client'`) karena memakai state, event, dan data dari API. Pengecualiannya `catatan/page.tsx`, yang mengambil data di server lewat DAL. Import memakai alias `@/` → `src/`.

## Catatan

- Data contoh mengacu pada periode **Oktober 2026** (hari ini pada data contoh: 2 Oktober 2026), ditambah data September untuk perbandingan periode.
- **Semua halaman** membaca & menyimpan data lewat backend, termasuk Profil & denah, Virtual galeri (unggah berkas sungguhan), Konten, Pengguna & peran, dan Pengaturan.
- Hak akses tiap peran mengikuti matriks di halaman *Pengguna & peran* dan ditegakkan di dua lapis: UI (menu, halaman 403, mode lihat saja) dan backend (403). Lihat [Tugas #9](#tugas-9--autentikasi--otorisasi).
- Masih berupa rancangan (tidak memproses apa pun): ringkasan harian lewat email, verifikasi dua langkah, kirim ulang tiket, dan alur aktivasi undangan staf.
- Untuk mengembalikan data acara ke kondisi awal, klik **Pulihkan data contoh** di bawah tabel *Daftar acara*. Untuk seluruh data, jalankan `npm run seed` di backend.
- Unduh laporan format CSV benar-benar mengunduh transaksi dari backend; format PDF/Excel belum tersedia.

## CHECK POINT 11 — Auth & Form Validation

Pemetaan bagian frontend [Panduan CHECK POINT 11](https://app.notion.com/p/Panduan-CHECK-POINT-11-3d51fdd9f0e58066920ccf88c5737dba). Bagian backend, Prisma, dan Vercel Blob ada di [README backend](../../backend/admin-dashboard/README.md#check-point-11--auth-validasi-prisma--vercel-blob).

| File panduan | Di proyek ini | Isi |
|---|---|---|
| `src/app/(auth)/login/page.tsx` | [`page.tsx`](src/app/(auth)/login/page.tsx) → `components/login.tsx` | Judul, keterangan (panel hero), dan `LoginForm`; pengguna yang sudah login langsung dialihkan |
| `.../login/components/LoginForm.tsx` | [`LoginForm.tsx`](src/app/(auth)/login/components/LoginForm.tsx) | Username/password, validasi browser, pesan kesalahan per kolom, kirim ke Server Action `login` (→ `POST /api/auth/login`) |
| `src/app/(auth)/register/page.tsx` | [`page.tsx`](src/app/(auth)/register/page.tsx) | Halaman pendaftaran staf (menunggu persetujuan Administrator utama) |
| `.../register/components/RegisterForm.tsx` | [`RegisterForm.tsx`](src/app/(auth)/register/components/RegisterForm.tsx) | Nama, username, email, password + konfirmasi; validasi awal lalu `POST /api/auth/register` |
| `src/lib/api.ts` | [`src/lib/api.ts`](src/lib/api.ts) | Request ke backend lewat proxy `/api/be`, yang menyertakan token dari cookie HttpOnly. Menangani error, termasuk 401 → sesi dikosongkan |
| `src/lib/user-auth.ts` | [`src/lib/user-auth.ts`](src/lib/user-auth.ts) | `useUser()`, `useIsAdmin()`, `login`, `register`, `logout()`, `refreshUser()` untuk tampilan |
| `src/app/(dashboard)/layout.tsx` | [`layout.tsx`](src/app/(dashboard)/layout.tsx) | Semua halaman panel: `getCurrentUser()` (DAL) mengalihkan pengguna belum login ke `/login`; ditambah `proxy.ts`. Backend tetap memeriksa setiap request |
| `src/components/site/auth-gate.tsx` | [`auth-gate.tsx`](src/components/site/auth-gate.tsx) | Ajakan login saat sesi berakhir atau dicabut ketika panel masih terbuka (API membalas 401) |
| `src/lib/types.ts` | [`src/lib/types.ts`](src/lib/types.ts) | `User` (`id`, `email`, `roleKey`, `access`, …), `AuthResponse`, `RegisterResponse`, `MeResponse`, `Session` |
| `src/lib/validation/auth.ts` | [`src/lib/validation/auth.ts`](src/lib/validation/auth.ts) | Schema Zod login & daftar, `PasswordSchema` (huruf besar, huruf kecil, angka, minimal 8), `EmailSchema` |

Validasi frontend hanya memberi pesan cepat. Backend memeriksa ulang dengan aturan yang sama (`lib/validate.ts`, `lib/validatePassword.ts`), karena request bisa dikirim tanpa lewat form web.

**Lampiran dari aplikasi pengunjung.** Admin bisa membuka berkas yang diunggah lewat aplikasi; berkas dibuka di tab baru lewat `openFile()` di `lib/api.ts`:
- **Transaksi → Verifikasi pembayaran:** klik nama berkas untuk membuka bukti transfer.
- **Sewa → Tinjau berkas:** KTP, surat permohonan, dan proposal.
