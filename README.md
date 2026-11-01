# Sistem Informasi Taman Krida Budaya Jawa Timur (TKBJ)

Satu rancangan sistem dengan dua antarmuka, dipisah menjadi folder **frontend** dan **backend**:

| Folder | Isi | Pengguna | Teknologi |
|---|---|---|---|
| [`frontend/admin-dashboard/`](frontend/admin-dashboard) | **Dashboard Web** | Administrator TKBJ | Next.js 16 (React 19) |
| [`frontend/mobile-app/`](frontend/mobile-app) | **Mobile Application** | Pengunjung / pengguna akhir | Flutter |
| [`backend/admin-dashboard/`](backend/admin-dashboard) | **API Dashboard Web** | — | Node.js, Express 5, TypeScript, MySQL |
| [`backend/mobile-app/`](backend/mobile-app) | **API Mobile App** (satu database dengan dashboard) | — | Node.js, Express 5, TypeScript, MySQL |

TKBJ adalah pusat seni dan budaya Jawa Timur di Kota Malang, di bawah Disbudpar Provinsi Jawa Timur. Pengunjung memakai aplikasi mobile untuk melihat agenda, membeli tiket pertunjukan, dan mengajukan sewa gedung. Admin memakai dashboard web untuk mengelola acara, tiket, sewa, dan pembayaran.

Dashboard web mengambil datanya dari backend (database MySQL berisi data contoh). Backend aplikasi mobile sudah tersedia di port 5001 dan memakai database yang sama: pesanan tiket, bukti transfer, pengajuan sewa, dan pendaftaran komunitas dari aplikasi langsung masuk ke antrean dashboard, lalu keputusan admin kembali ke aplikasi sebagai notifikasi. Aplikasi Flutter sudah tersambung ke API ini. Untuk presentasi tanpa server tersedia mode demo (`flutter run --dart-define=DEMO_MODE=true`).

**Desain Figma:** [Highfi-Taman-Krida](https://www.figma.com/design/arjM0e1ApzkZ58oERTzCa8/Highfi-Taman-Krida)

## Autentikasi & otorisasi (Tugas #9)

Terintegrasi di dashboard web + backend: **registrasi** (`/register`, menunggu persetujuan admin), **login** (JWT), **logout** (sesi dicabut di server), password **bcrypt**, dan **RBAC 5 peran** yang ditegakkan di UI (menu, halaman 403, mode lihat saja) dan di API (401/403).

| Username | Password | Peran |
|---|---|---|
| `admin` | `admin123` | Administrator utama |
| `nur.aini` | `tkbj2026` | Admin Acara |
| `keuangan` | `keuangan123` | Admin Keuangan |
| `rina.s` | `tkbj2026` | Admin Sewa |
| `siti.rahma` | `tkbj2026` | Admin Konten |
| `dimas.p` | `tkbj2026` | Pendaftar — menunggu persetujuan (login ditolak) |

Rincian, panduan uji coba, dan screenshot: [frontend/admin-dashboard/README.md → Tugas #9](frontend/admin-dashboard/README.md#tugas-9--autentikasi--otorisasi). Detail API & middleware: [backend/admin-dashboard/README.md](backend/admin-dashboard/README.md#autentikasi--otorisasi).

## PBL Guide Modul 01–03

Mengikuti [PBL Engineering Guide](https://pbl-guidlines.vercel.app/docs/01-setup-project):

- **Modul 01 — Setup Project:** backend Express + TypeScript + MySQL (`mysql2` SQL murni untuk model fitur), JWT, port 5000, siap dipublikasikan lewat Ngrok. Migration/seeder kini memakai Prisma (CHECK POINT 11).
- **Modul 02 — Form, Auth DAL & Mutasi Data:** cookie sesi HttpOnly, DAL `getCurrentUser()`, `proxy.ts`, Server Actions + Zod + `useActionState`, anti-IDOR, aksi khusus admin, dan `useOptimistic`. Diterapkan di halaman baru **Catatan staf**.
- **Modul 03 — File Upload & Cloud Storage:** Multer (5 MB, whitelist MIME), storage dual-mode (Vercel Blob / folder lokal), rollback anti-file yatim, dan hapus anti-IDOR. Diterapkan di halaman baru **Dokumen**, lengkap dengan drag & drop, progres unggah, dan pratinjau.

## CHECK POINT 11 — Auth, validasi, Prisma & Vercel Blob

Mengikuti [Panduan CHECK POINT 11](https://app.notion.com/p/Panduan-CHECK-POINT-11-3d51fdd9f0e58066920ccf88c5737dba):

- **Frontend:**
  - `LoginForm.tsx`, `RegisterForm.tsx`;
  - `lib/types.ts`, `lib/user-auth.ts`, `lib/validation/auth.ts`;
  - `components/site/auth-gate.tsx`, route group `(dashboard)/layout.tsx`.
- **Backend (kedua API):**
  - `routes/authRoutes.ts` (`/api/auth`), `authController.ts`;
  - `lib/validate.ts`, `lib/validatePassword.ts` (huruf besar, huruf kecil, dan angka);
  - `middleware/authMiddleware.ts` → `req.user`, `requireRole.ts`, `rateLimiter.ts`;
  - `types/express.d.ts`, `lib/prisma.ts`.
- **Prisma & Migration:**
  - satu `prisma/schema.prisma` untuk seluruh tabel, di `backend/admin-dashboard`;
  - migration `0_init` + `1_blob_file_urls`;
  - database lama otomatis di-*baseline* saat `npm run migrate`;
  - seeder dan auth memakai Prisma Client.
- **Vercel Blob:**
  - foto/video galeri;
  - bukti bayar dan berkas sewa dari aplikasi (blob privat);
  - dashboard bisa membuka lampiran tersebut.

Pemetaan per berkas ada di README [backend](backend/admin-dashboard/README.md#check-point-11--auth-validasi-prisma--vercel-blob) dan [frontend](frontend/admin-dashboard/README.md#check-point-11--auth--form-validation).

Perencanaan data & hak aksesnya: [docs/fitur-dan-akses.md](docs/fitur-dan-akses.md). Rincian per langkah ada di README [frontend](frontend/admin-dashboard/README.md#modul-02--03--ruang-kerja-staf) dan [backend](backend/admin-dashboard/README.md#modul-03--upload-berkas--storage).

## Menjalankan

```bash
# 1. Backend dashboard (terminal 1)
cd backend/admin-dashboard
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run migrate          # MySQL (XAMPP) harus menyala; migration Prisma untuk seluruh tabel
npm run seed
npm run dev              # http://localhost:5000/api

# 2. Dashboard web (terminal 2)
cd frontend/admin-dashboard
npm install
npm run dev              # http://localhost:3000 · akun: admin / admin123 (akun per peran: lihat di atas)

# 3. Backend mobile app (terminal 3, setelah langkah 1)
cd backend/mobile-app
npm install
cp .env.example .env
npm run migrate          # meneruskan ke migration Prisma di backend dashboard
npm run seed
npm run dev              # http://localhost:5001/api · akun: budi.santoso@email.com / tkbj2026

# 4. Mobile app
cd frontend/mobile-app
flutter pub get
flutter run              # emulator Android → API di http://10.0.2.2:5001/api · akun: budi.santoso@email.com / tkbj2026
# HP sungguhan / Ngrok: flutter run --dart-define=API_URL=http://<ip-laptop>:5001/api
# Tanpa server:         flutter run --dart-define=DEMO_MODE=true
```

Panduan lengkap ada di README masing-masing folder:

- [frontend/admin-dashboard/README.md](frontend/admin-dashboard/README.md)
- [backend/admin-dashboard/README.md](backend/admin-dashboard/README.md)
- [backend/mobile-app/README.md](backend/mobile-app/README.md)
- [frontend/mobile-app/README.md](frontend/mobile-app/README.md)

## Rancangan fitur AI

**Asisten Verifikasi Bukti Pembayaran.** Pengguna mengunggah foto bukti transfer dari aplikasi mobile. AI (OCR / vision model) membaca nominal, pengirim, dan tanggal, mencocokkannya dengan tagihan, lalu memberi saran beserta skor keyakinan kepada admin di dashboard web. Keputusan akhir tetap di tangan admin. Fitur ini belum diimplementasikan; rinciannya ada di README dashboard.
