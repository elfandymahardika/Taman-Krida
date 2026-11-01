# TKBJ Admin API — Backend Dashboard Web

REST API untuk [Panel Administrator TKBJ](../../frontend/admin-dashboard). Dibangun dengan **Express 5 + TypeScript** dan **MySQL**, mengikuti [PBL Guide Modul 01 — Setup Project](https://pbl-guidlines.vercel.app/docs/01-setup-project):

- **Prisma** untuk skema, *migration* & *seeder* (`prisma/schema.prisma`, `prisma/migrations/`, `src/db/`), serta **Prisma Client** untuk auth (`src/lib/prisma.ts` → `models/userModel.ts`, `models/sessionModel.ts`). Sejak CHECK POINT 11, Prisma menggantikan Sequelize.
- **mysql2 connection pool** + **query SQL murni** untuk model fitur lain (`src/config/db.ts`, `src/models/`).
- **Middleware** (`src/middleware/`):
  - validasi input: `validator.ts`, dengan aturan di `lib/validate.ts` & `lib/validatePassword.ts`;
  - JWT: `authMiddleware.ts` → `req.user` & `res.locals.userId`;
  - peran: `requireRole.ts`;
  - pembatas percobaan login/daftar: `rateLimiter.ts`.
- **Controller** per modul:
  - rute auth di `src/routes/authRoutes.ts` (`/api/auth`);
  - rute lain di `src/routes/api.ts`;
  - konfigurasi Express di `src/app.ts`, entry point `src/server.ts`.

Pemetaan lengkap ke panduan ada di bagian [CHECK POINT 11](#check-point-11--auth-validasi-prisma--vercel-blob).

## Menjalankan

Prasyarat: **Node.js 20+** (diuji dengan Node 24) dan **MySQL / MariaDB** yang menyala (mis. XAMPP → *Start* MySQL, port 3306).

```bash
cd backend/admin-dashboard
npm install               # juga menjalankan `prisma generate` (postinstall)
cp .env.example .env      # Windows: copy .env.example .env  → sesuaikan DB_* dan ganti JWT_SECRET
npm run migrate           # membuat database tkbj_admin (bila belum ada) + menjalankan migration Prisma
npm run seed              # mengisi data contoh
npm run dev               # http://localhost:5000/api (nodemon, restart otomatis saat kode berubah)
```

Saat server jalan, terminal menampilkan `✓ Database MySQL Connection Pool berhasil terhubung` dan `🚀 Server Express berjalan di http://localhost:5000`.

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan (`nodemon` + `ts-node src/server.ts`) |
| `npm run build` · `npm start` | Kompilasi ke `dist/` lalu jalankan hasil kompilasi |
| `npm run migrate` | `prisma migrate deploy`: jalankan migration yang belum dijalankan (tercatat di tabel `_prisma_migrations`). Database lama buatan Sequelize otomatis di-*baseline* sebagai `0_init`, datanya tetap utuh |
| `npm run migrate:fresh` | `prisma migrate reset`: hapus semua tabel lalu buat ulang. Prisma meminta konfirmasi; hanya untuk database development |
| `npm run prisma -- migrate dev --name <nama>` | Buat migration baru setelah mengubah `prisma/schema.prisma` |
| `npm run prisma -- studio` | Prisma Studio: lihat dan ubah isi tabel di browser |
| `npm run seed` | Kosongkan tabel lalu isi ulang dengan data contoh (Prisma Client) |
| `npm run typecheck` | Pemeriksaan tipe TypeScript |
| `npm test` | Tes integrasi API di database terpisah `tkbj_admin_test` (dibuat & diisi ulang otomatis) |

## Konfigurasi (`.env`)

| Variabel | Bawaan | Keterangan |
|---|---|---|
| `PORT` | `5000` | Port HTTP |
| `DB_HOST` · `DB_PORT` | `localhost` · `3306` | Server MySQL |
| `DB_NAME` | `tkbj_admin` | Nama database (dibuat otomatis oleh `npm run migrate`) |
| `DB_USER` · `DB_PASSWORD` | `root` · kosong | Kredensial MySQL (bawaan XAMPP) |
| `JWT_SECRET` | rahasia dev | **Wajib** diganti; wajib diisi bila `NODE_ENV=production` |
| `FRONTEND_URL` | `http://localhost:3000` | Origin frontend yang diizinkan CORS, pisahkan dengan koma (mis. tambah origin frontend rekan tim) |
| `UPLOADS_DIR` | `uploads` | Folder berkas galeri & dokumen bila tanpa Vercel Blob (disajikan di `/uploads/…`) |
| `BLOB_READ_WRITE_TOKEN` | kosong | Token Vercel Blob: galeri & dokumen staf disimpan di cloud. Pakai token yang sama di backend mobile agar lampiran dari aplikasi bisa dibuka |
| `BLOB_ACCESS` | `private` | Akses lampiran dari aplikasi di Vercel Blob (`private` / `public`) |
| `MOBILE_UPLOADS_DIR` | `../mobile-app/uploads` | Folder lampiran dari aplikasi bila tanpa Vercel Blob (sama dengan `UPLOADS_DIR` backend mobile) |
| `DATABASE_URL` | disusun dari `DB_*` | Opsional; isi hanya bila memakai URL MySQL lain (mis. hosting) |
| `UPLOAD_LIMIT_MB` | `25` | Ukuran maksimal satu berkas unggahan |
| `APP_TODAY` | `2026-10-02` | "Hari ini" pada data contoh (agenda & periode bawaan) |

Masa berlaku token login diatur dari halaman **Pengaturan → Keamanan → Durasi sesi**, bukan dari `.env`. File `.env` tidak di-commit (sudah ada di `.gitignore`).

## Skema database

Skema seluruh tabel ada di satu file, [`prisma/schema.prisma`](prisma/schema.prisma), termasuk tabel `visitor_*` milik [API mobile](../mobile-app). Migration-nya ada di `prisma/migrations/`:

- `0_init`: struktur awal;
- `1_blob_file_urls`: kolom berkas diperlebar untuk URL Vercel Blob.

Tabel panel admin:

| Tabel | Isi | Relasi |
|---|---|---|
| `users` | Staf admin = akun login (`password_hash` bcrypt, `role_key`, `status`) | |
| `sessions` | Satu baris per login; logout mengisi `revoked_at` | `user_id` → `users` (CASCADE) |
| `kv` | Profil lembaga & pengaturan panel (JSON) | |
| `facilities` | Area/fasilitas TKBJ | |
| `media` | Virtual galeri | |
| `contents` | Konten aplikasi publik & banner beranda | |
| `events` | Agenda acara + kuota/harga tiket | |
| `rentals` | Permintaan sewa gedung | |
| `orders` | Pesanan tiket & tagihan sewa | `event_id` → `events`, `rental_id` → `rentals` (SET NULL) |
| `communities` | Direktori komunitas seni | |
| `finance_monthly` | Rekap penjualan & pembelian per bulan (juta rupiah) | |
| `activity` · `notifications` | Log aktivitas & notifikasi dashboard | |
| `notes` | Catatan pribadi staf (Modul 02) | `user_id` → `users` (CASCADE) |
| `documents` | Metadata dokumen unggahan (Modul 03); file fisik ada di storage, bukan BLOB | `user_id` → `users` (CASCADE) |

Status memakai `ENUM`, tanggal `DATE`, jam `TIME`, dan waktu kejadian `DATETIME(3)` dalam **UTC** (API mengirimnya sebagai ISO `…Z`).

## Publikasi via Ngrok (kolaborasi tim)

Agar frontend anggota tim di laptop lain bisa memakai backend ini:

1. Pastikan `npm run dev` berjalan di port 5000.
2. Daftar di [ngrok.com](https://ngrok.com), pasang CLI (`winget install ngrok`), lalu simpan authtoken: `ngrok config add-authtoken TOKEN_KAMU` — **jangan pernah meng-commit token ini**.
3. Tambahkan origin frontend rekan ke `FRONTEND_URL` di `.env` (pisahkan koma), restart backend.
4. Jalankan `ngrok http 5000` di terminal terpisah dan bagikan URL `https://xxxxx.ngrok-free.app`.
5. Rekan mengisi `frontend/admin-dashboard/.env.local`: `NEXT_PUBLIC_API_URL=https://xxxxx.ngrok-free.app/api`, lalu restart `npm run dev`. Frontend sudah mengirim header `ngrok-skip-browser-warning` sehingga tidak tertahan halaman peringatan Ngrok Free.

URL Ngrok Free berubah setiap kali ngrok dijalankan ulang — perbarui `.env.local` rekan bila itu terjadi. Permintaan yang masuk bisa dipantau di http://127.0.0.1:4040.

## Akun & peran

Staf admin di halaman *Pengguna & peran* adalah akun login yang sama. Akun dummy per peran untuk uji coba:

| Username | Password | Peran | Keterangan |
|---|---|---|---|
| `admin` | `admin123` | Administrator utama | Akses penuh, termasuk menyetujui pendaftaran |
| `nur.aini` | `tkbj2026` | Admin Acara | Juga `bayu.k` |
| `keuangan` | `keuangan123` | Admin Keuangan | Juga `lestari.ayu` / `tkbj2026` |
| `rina.s` | `tkbj2026` | Admin Sewa | |
| `siti.rahma` | `tkbj2026` | Admin Konten | |
| `dimas.p` | `tkbj2026` | — | Hasil registrasi, **menunggu persetujuan** → login ditolak 403 |
| `wahyu.h` | `tkbj2026` | Admin Sewa | **Nonaktif** → login ditolak 403 |

Hak akses per modul (didefinisikan di `src/lib/roles.ts`, ditampilkan sebagai matriks di dashboard):

| Peran | Acara & tiket | Sewa gedung | Transaksi | Informasi & komunitas | Pengguna & pengaturan |
|---|---|---|---|---|---|
| Administrator utama | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin Acara | ✓ | – | ✕ | – | ✕ |
| Admin Keuangan | – | – | ✓ | ✕ | ✕ |
| Admin Sewa | – | ✓ | – | ✕ | ✕ |
| Admin Konten | – | ✕ | ✕ | ✓ | ✕ |

✓ boleh melihat & mengubah · – hanya melihat (aksi ubah → **403**) · ✕ tanpa akses (semua endpoint modul → **403**).

## Autentikasi & otorisasi

**Autentikasi (siapa Anda)**

- **Registrasi** — `POST /api/auth/register` membuat akun berstatus *Menunggu persetujuan* tanpa peran. Akun belum bisa login sampai Administrator utama menyetujuinya (sekaligus memilih peran) lewat `POST /api/users/:id/approve`, atau menolaknya lewat `/reject`. Validasi: nama ≥ 3 karakter, username unik (huruf kecil/angka/titik/garis bawah), email unik, password ≥ 8 karakter dengan huruf besar, huruf kecil, dan angka (`lib/validatePassword.ts`), konfirmasi password sama.
- **Password** disimpan sebagai hash **bcrypt** (`bcryptjs`, cost 10, salt acak) — tidak pernah sebagai teks asli. Hash format lama (scrypt) tetap bisa login dan otomatis diganti ke bcrypt saat login berhasil.
- **Login** — `POST /api/auth/login` mengembalikan token **JWT** (`Authorization: Bearer <token>`) beserta profil dan hak akses (`user.access`). Username tidak ada dan password salah dibalas pesan yang sama (*Username atau password salah*) agar tidak membocorkan akun yang terdaftar; setelah batas percobaan gagal, username dikunci 15 menit (429).
- **Sesi** — setiap login dicatat di tabel `sessions` (`jti` di dalam JWT). **Logout** — `POST /api/auth/logout` mencabut sesi itu, sehingga token yang sama langsung ditolak (401) walaupun belum kedaluwarsa. Menonaktifkan akun juga mencabut semua sesinya.
- Akun *Menunggu persetujuan*, *Ditolak*, *Nonaktif*, dan *Undangan* ditolak saat login (**403**) dan saat memakai token lama (**401**).

**Otorisasi (boleh apa) — RBAC**

- Middleware `authMiddleware` (`src/middleware/authMiddleware.ts`, semua rute selain `health`, `register`, `login`) memverifikasi `Bearer <token>`, memastikan sesinya belum dicabut, lalu memasang `req.user` (beserta `res.locals.userId` dan `res.locals.user`) → tanpa token / token dicabut = **401**.
- Middleware `requireView(modul)` / `requireRole(peran)` (`src/middleware/requireRole.ts`, dipasang per rute di `src/routes/api.ts`) → modul bertanda ✕ = **403** untuk semua endpoint-nya.
- Middleware `requireAccess(modul)` di setiap rute ubah → modul bertanda – atau ✕ = **403**.
- Middleware `validator.ts` memeriksa kelengkapan & format input (register, login, acara, sewa, konten, profil, media) sebelum controller → **400** dengan pesan per kolom.
- Data campuran disaring per peran: ringkasan dashboard (nilai pendapatan & antrean tugas), pencarian global, notifikasi, dan log aktivitas hanya berisi modul yang boleh dilihat. Pesanan tiket boleh dilihat peran yang punya akses *Acara & tiket* walau tanpa akses *Transaksi*.
- Peran dan status dibaca ulang dari database pada setiap permintaan, jadi perubahan peran dan penonaktifan akun langsung berlaku.

Undangan staf dari admin berstatus *Undangan* dan belum bisa masuk (alur aktivasi belum dibuat).

## Endpoint

Semua endpoint selain `/api/health`, `/api/auth/register`, dan `/api/auth/login` wajib login; modul di luar hak akses peran dibalas **403**. Error dikembalikan sebagai `{ "error": "...", "fields": { "kolom": "pesan" } }`.

| Metode & path | Keterangan |
|---|---|
| `GET /api/health` | Status server |
| `POST /api/auth/register` | `{ name, username, email, password, confirm }` → akun *Menunggu persetujuan* (201, tanpa token) |
| `POST /api/auth/login` | `{ username, password }` → `{ token, expiresIn, user }` (`user.access` = hak akses per modul) |
| `POST /api/auth/logout` | Cabut sesi token yang dipakai (204); token itu tidak berlaku lagi |
| `GET /api/auth/me` | Profil & hak akses admin yang sedang login |
| `GET /api/dashboard/summary?period=2026-10` | Metrik periode (bulan `YYYY-MM` atau tahun `YYYY`) + periode sebelumnya, antrean tugas |
| `GET /api/finance/monthly` | Rekap penjualan & pembelian bulanan (juta rupiah) |
| `GET /api/events` | Daftar acara; filter `from`, `to`, `status`, `venue`, `q` |
| `POST /api/events` · `PUT/PATCH/DELETE /api/events/:id` | Kelola acara (admin) |
| `POST /api/events/reset` | Pulihkan data contoh acara (admin) |
| `GET /api/orders` | Transaksi tiket & sewa; filter `type`, `payment`, `eventId`, `q`, `limit` |
| `GET /api/orders/export.csv` | Unduh transaksi sebagai CSV |
| `POST /api/orders/:id/verify` | Verifikasi bukti transfer → lunas |
| `POST /api/orders/:id/reject` | Minta pemesan mengunggah bukti ulang |
| `POST /api/orders/:id/payment` | Catat pembayaran manual `{ amount, method, note }` |
| `GET /api/rentals` | Permintaan sewa + deteksi bentrok jadwal |
| `POST /api/rentals` | Catat pemesanan baru (admin) |
| `POST /api/rentals/:id/approve` · `/reject` · `/files-complete` | Putuskan permintaan sewa (admin) |
| `GET /api/communities` | Direktori & permohonan komunitas |
| `POST /api/communities` · `/:id/approve` · `/:id/reject` · `PATCH /:id` | Kelola komunitas (admin) |
| `GET /api/activity?limit=8&before=<id>&kind=payment` | Log aktivitas (paginasi kursor) |
| `GET /api/notifications` · `POST /read-all` · `POST /:id/read` | Notifikasi admin |
| `GET /api/search?q=` | Pencarian global acara, transaksi, sewa, komunitas, konten, galeri, staf |
| `GET/PUT /api/profile` | Profil lembaga yang tampil di aplikasi publik |
| `GET/POST /api/facilities` · `PUT /api/facilities/:id` | Area & fasilitas (nama area yang dipakai acara/sewa dikunci) |
| `GET /api/media` | Koleksi virtual galeri |
| `POST /api/media?name=&collection=&title=&description=` | Unggah berkas mentah (`Content-Type: image/*` atau `video/*`) → media draf |
| `PUT/PATCH/DELETE /api/media/:id` | Metadata, status terbit, hapus (berkas ikut dihapus) |
| `GET/POST /api/contents` · `PUT /api/contents/:id` | Konten & banner beranda (`isHero`) |
| `GET/POST /api/users` · `PATCH /api/users/:id` | Staf: undang, ubah peran, aktif/nonaktif (nonaktif = semua sesi dicabut) |
| `POST /api/users/:id/approve` `{ roleKey }` · `POST /api/users/:id/reject` | Setujui (pilih peran) atau tolak pendaftaran |
| `GET /api/users/roles` | Peran, modul, dan matriks hak akses |
| `GET/PUT /api/settings` · `POST /api/settings/reset` | Pengaturan panel |
| `GET /api/notes` (`?scope=all` khusus admin) | Catatan milik sendiri; admin dapat melihat semua staf |
| `POST /api/notes` · `PUT /api/notes/:id` · `DELETE /api/notes/:id` | `{ title, content, status }`; pemilik dari token, ubah/hapus milik orang lain → **404** |
| `PATCH /api/notes/:id/archive` | Arsipkan catatan staf mana pun, khusus Administrator utama (lainnya **403 FORBIDDEN**) |
| `POST /api/upload` | Unggah `multipart/form-data` field `file` (JPG/PNG/WEBP/PDF ≤ 5 MB) → `201 { data }` |
| `GET /api/upload/list` | Dokumen milik sendiri (admin: semua) + batas unggahan & mode storage |
| `DELETE /api/upload/:id` | Hapus file fisik lalu metadata; dokumen orang lain → **404** (admin boleh semua) |

## Modul 02 — Catatan staf

Backend untuk halaman **Catatan staf** (`/catatan`). Form, Server Action, DAL, dan Zod ada di frontend (lihat README frontend).

- `validateNote` (validator.ts) memeriksa ulang isian: judul 3–100 karakter, isi ≤ 500, status `Draf`/`Terpublikasi`/`Diarsipkan`. Kolom `userId` di body diabaikan.
- `models/noteModel.ts`: setiap query ubah/hapus berbentuk `WHERE id = ? AND user_id = ?` (anti-IDOR). Administrator utama memakai varian tanpa filter pemilik.
- `controllers/noteController.ts`: catatan orang lain dibalas 404 (bukan 403) agar keberadaan ID tidak bocor. Arsip hanya untuk peran `admin`.

## Modul 03 — Upload berkas & storage

| Bagian | File | Isi |
|---|---|---|
| Migration | `db/migrations/015-create-documents.ts` | Tabel metadata `documents` (bukan BLOB) |
| Storage service | `services/storage.service.ts` | **Dual-mode**: Vercel Blob bila `BLOB_READ_WRITE_TOKEN` diisi, selain itu folder `uploads/`. Nama file acak (`timestamp-hash-nama`), ekstensi diambil dari MIME, dan `path.basename` mencegah path traversal. URL lokal relatif (`/uploads/…`) agar tetap benar lewat proxy Next.js/Ngrok. |
| Middleware | `middleware/upload.middleware.ts` | Multer `memoryStorage`, `fileSize` 5 MB, whitelist MIME, ditambah cek *magic number* (file `.exe` yang diberi Content-Type `image/png` tetap ditolak). Semua error upload → **400 JSON**. |
| DAL | `models/documentModel.ts` | Query SQL murni dokumen (`createDocument`, `getDocumentById`, `getDocumentsByUserId`, `getAllDocuments`, `deleteDocumentFromDb`) |
| Controller | `controllers/upload.controller.ts` | Upload dengan **rollback** (insert database gagal → file fisik dihapus), daftar per pemilik, hapus anti-IDOR |
| Rute | `routes/upload.routes.ts` | `authMiddleware` untuk semua rute; dipasang di `/api/upload` |

Berkas di `/uploads/…` disajikan statis dengan `X-Content-Type-Options: nosniff`. Reset data (`npm run seed`) ikut menghapus file dokumen agar tidak ada file yatim. Tes **Pertemuan 11** (P11-1 sampai P11-6) ada di `test/api.test.ts`.

## Aturan bisnis

- **Verifikasi pembayaran tiket** menambah `sold` pada acara (ditolak bila kuota tidak cukup) dan menambah rekap penjualan bulan itu — grafik keuangan di dashboard ikut berubah.
- **Kuota** tidak boleh di bawah tiket terjual. Acara yang sudah punya pesanan tidak bisa dihapus (tarik publikasinya saja).
- **Sewa gedung** ditolak bila jamnya bentrok dengan acara atau sewa lain yang sudah disetujui di fasilitas & tanggal yang sama. Saat disetujui, tagihan sewa (`Menunggu bayar`) dibuat otomatis sesuai tarif fasilitas.
- Setiap perubahan dicatat di **log aktivitas**; kejadian penting juga menjadi **notifikasi**.
- **Pengaturan yang langsung berlaku:** sakelar notifikasi (pembayaran, sewa, komunitas), *Catat log aktivitas*, *Durasi sesi* (masa berlaku token untuk login berikutnya), dan *Maks. percobaan masuk* (setelah batas, username dikunci 15 menit). Pengaturan pemesanan & pembayaran disimpan untuk backend mobile nanti; *Ringkasan harian* dan *Verifikasi dua langkah* belum diimplementasikan.
- **Akun:** staf tidak bisa mengubah peran/status akunnya sendiri, dan akun Administrator utama dilindungi.
- **Galeri:** berkas diunggah sebagai draf dan disajikan tanpa login di `/uploads/…` karena memang untuk galeri publik.

## Struktur

```
prisma/
├── schema.prisma             skema SELURUH tabel (panel admin + visitor_* aplikasi mobile)
└── migrations/               0_init (struktur awal), 1_blob_file_urls, migration_lock.toml
src/
├── server.ts                 entry point: dotenv, uji koneksi pool, app.listen
├── app.ts                    Express: CORS, JSON parser, /uploads, /api/auth (authRoutes) + /api (api.ts), error handler
├── config/
│   ├── db.ts                 MySQL connection pool (mysql2) + helper transaksi
│   └── env.ts                konfigurasi aplikasi dari .env
├── db/
│   ├── migrate.ts            npm run migrate / migrate:fresh (Prisma Migrate + baseline database lama)
│   ├── prisma.ts             pembungkus Prisma CLI (npm run prisma -- …) dengan DATABASE_URL dari DB_*
│   └── seeders/              data.ts (data contoh), 001-seed-users.ts … 013-seed-documents.ts + run.ts (Prisma Client)
├── types/express.d.ts        tipe req.user (AuthUser) & res.locals
├── models/                   userModel & sessionModel (Prisma Client); visitorFileModel (Prisma, lampiran aplikasi);
│                             model lain query SQL murni: event, order, rental, community, content, media, facility,
│                             finance, feed, kv, note (Modul 02), document (Modul 03)
├── services/storage.service.ts  storage dual-mode (Vercel Blob / folder uploads/) + pembaca lampiran aplikasi
├── middleware/               authMiddleware.ts (JWT → req.user), requireRole.ts (peran & matriks modul),
│                             rateLimiter.ts (pembatas login/daftar + kunci akun), validator.ts, upload.middleware.ts,
│                             errorHandler.ts
├── controllers/              authController (bcrypt & JWT), user, event, order, rental, community, content, media,
│                             profile, dashboard, feed, search, settings, noteController, upload.controller,
│                             visitorFileController (bukti bayar & berkas sewa dari aplikasi)
├── routes/authRoutes.ts      POST /register, POST /login, POST /logout, GET /me (dipasang di /api/auth)
├── routes/api.ts             rute API lain + middleware yang dipasang
├── routes/upload.routes.ts   rute /api/upload (Modul 03)
└── lib/                      prisma.ts (koneksi Prisma), databaseUrl.ts, validate.ts, validatePassword.ts,
                              roles (matriks hak akses), settings, password (bcrypt), format, error HTTP, log aktivitas
uploads/                      berkas galeri & dokumen bila tanpa Vercel Blob (diabaikan git)
test/api.test.ts              tes integrasi (node:test) di database tkbj_admin_test
```

Pemetaan contoh panduan → proyek ini: tabel `todos` diganti tabel-tabel TKBJ di atas; `/api/register` & `/api/login` menjadi `/api/auth/register` & `/api/auth/login` (login memakai username, registrasi menunggu persetujuan admin); rute terlindungi JWT = semua rute selain health/register/login.

## CHECK POINT 11 — Auth, validasi, Prisma & Vercel Blob

Pemetaan isi [Panduan CHECK POINT 11](https://app.notion.com/p/Panduan-CHECK-POINT-11-3d51fdd9f0e58066920ccf88c5737dba) ke backend ini. Bagian frontend ada di [README dashboard](../../frontend/admin-dashboard/README.md#check-point-11--auth--form-validation).

### 2. Backend — endpoint, validasi, pengamanan akses

| File panduan | Di proyek ini | Isi |
|---|---|---|
| `src/app.ts` | [`src/app.ts`](src/app.ts) | Express, parser JSON, CORS. Prefix `/api/auth` → `authRoutes`, sisanya `/api` → `api.ts` |
| `src/routes/authRoutes.ts` | [`src/routes/authRoutes.ts`](src/routes/authRoutes.ts) | `POST /register`, `POST /login`, `POST /logout`, `GET /me`, beserta middleware tiap endpoint |
| `src/controllers/authController.ts` | [`src/controllers/authController.ts`](src/controllers/authController.ts) | Membaca data, cek username/email terdaftar, hash bcrypt, cocokkan password, terbitkan JWT + sesi, kirim respons |
| `src/lib/validate.ts` | [`src/lib/validate.ts`](src/lib/validate.ts) | Helper validasi: `isString`, `str`, `isEmail`, `isDate`, `isTime`, `lengthError`. Dipakai `middleware/validator.ts` & controller |
| `src/lib/validatePassword.ts` | [`src/lib/validatePassword.ts`](src/lib/validatePassword.ts) | Minimal 8 karakter, huruf besar, huruf kecil, angka; maksimal 72 byte (batas bcrypt) |
| `src/middleware/authMiddleware.ts` | [`src/middleware/authMiddleware.ts`](src/middleware/authMiddleware.ts) | Verifikasi JWT + sesi belum dicabut + akun aktif → `req.user` (dan `res.locals.userId` standar Modul 01) |
| `src/middleware/requireRole.ts` | [`src/middleware/requireRole.ts`](src/middleware/requireRole.ts) | `requireRole('admin')` untuk rute Pengguna & Pengaturan; `requireView` / `requireAccess` per modul (matriks peran) |
| `src/middleware/rateLimiter.ts` | [`src/middleware/rateLimiter.ts`](src/middleware/rateLimiter.ts) | Login: 20 percobaan gagal / IP / 15 menit; daftar: 10 / IP / jam (429 + `Retry-After`); kunci akun setelah N kali salah (Pengaturan → Keamanan) |
| `src/types/express.d.ts` | [`src/types/express.d.ts`](src/types/express.d.ts) | Tipe `req.user` (`AuthUser`) dan `res.locals` |
| `src/lib/prisma.ts` | [`src/lib/prisma.ts`](src/lib/prisma.ts) | Satu instance `PrismaClient`, dipakai `userModel`/`sessionModel` (controller & middleware auth) |

Validasi berlapis: Zod di Server Action frontend memberi pesan cepat, lalu `validator.ts` di backend memeriksa ulang. Input dengan tipe salah (mis. email berupa array, password berupa angka) ditolak 400.

### 3. Prisma & Migration

- **Skema tunggal:** [`prisma/schema.prisma`](prisma/schema.prisma) memetakan seluruh tabel MySQL. Model memakai PascalCase dengan `@@map` ke nama tabel, sedangkan nama kolom tetap snake_case agar query SQL lain tidak berubah. Skema ini juga mencakup tabel `visitor_*` milik API mobile (satu database); backend mobile hanya menyalinnya untuk Prisma Client (`npm run prisma:sync`).
- **Migration:** `0_init` dibuat dari struktur database yang sudah ada, lalu `1_blob_file_urls` memperlebar kolom berkas untuk URL Vercel Blob. Cara mengubah skema:
  1. Ubah `schema.prisma`.
  2. Jalankan `npm run prisma -- migrate dev --name <nama>`.
  3. Commit folder migration-nya.
  4. Rekan tim cukup menjalankan `npm run migrate`.
- **Database lama:** `npm run migrate` mendeteksi database buatan Sequelize, menandai `0_init` sudah dijalankan (*baseline*), menghapus tabel log Sequelize, lalu menjalankan migration berikutnya. Data tidak hilang.
- **Seeder:** `src/db/seeders/*.ts` memakai `prisma.<model>.createMany`.
- **Test:** memakai database `tkbj_admin_test` yang dibuat ulang setiap kali test dijalankan. Hanya database berakhiran `_test` yang boleh dikosongkan otomatis.

### 4. Upload & Cloud Storage (Vercel Blob)

Fitur proyek yang menerima berkas, sehingga memakai cloud storage:

| Fitur | Pengunggah | Penyimpanan | Ditinjau di |
|---|---|---|---|
| Foto/video galeri | Admin Konten | Vercel Blob `galeri/` (publik) atau `uploads/` | Dashboard → Galeri, aplikasi → Virtual Galeri |
| Dokumen staf (Modul 03) | Staf | Vercel Blob `documents/` atau `uploads/` | Dashboard → Dokumen |
| Bukti bayar tiket & sewa | Pengunjung (aplikasi) | Vercel Blob `tkbj-mobile/` (**private**) atau folder privat backend mobile | Dashboard → Transaksi → *buka lampiran* (`GET /api/orders/:id/proof`) |
| KTP, surat, proposal sewa | Pengunjung (aplikasi) | Sama dengan bukti bayar | Dashboard → Sewa → *Tinjau berkas* (`GET /api/rentals/:id/documents`) |

Alurnya:

1. Pilih file.
2. Validasi: Multer membatasi ukuran dan jenis, lalu *magic number* dicek.
3. Simpan ke storage.
4. Catat referensinya di database (URL blob atau nama berkas).
5. Tampilkan atau tinjau berkasnya.

Kalau penyimpanan ke database gagal, berkas yang sudah tersimpan ikut dihapus, jadi tidak ada file yatim. Lampiran pengunjung tidak pernah disajikan statis; berkas hanya di-stream lewat endpoint yang memeriksa peran (Admin Acara → 403).

Tanpa `BLOB_READ_WRITE_TOKEN`, semua berkas tetap berjalan di folder lokal.
