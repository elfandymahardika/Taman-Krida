# API Aplikasi Mobile TKBJ

REST API untuk aplikasi pengunjung ([`frontend/mobile-app`](../../frontend/mobile-app)). Stack-nya sama dengan [`backend/admin-dashboard`](../admin-dashboard) dan mengikuti PBL Guide: **Express 5 + TypeScript + MySQL**. Skema & migration memakai **Prisma** milik backend dashboard (satu database). Di sini ada salinan skemanya (`prisma/schema.prisma`) untuk Prisma Client, yang dipakai bagian auth (`visitors`, `visitor_sessions`). Model fitur lain memakai pool `mysql2` dengan SQL murni.

Struktur auth mengikuti CHECK POINT 11:
- `routes/authRoutes.ts` (`/api/auth`);
- `middleware/` (`authMiddleware` → `req.user`, `rateLimiter`, `validator`);
- `lib/validate.ts`, `lib/validatePassword.ts`, `lib/prisma.ts`;
- `types/express.d.ts`.

## Satu database dengan dashboard

API ini memakai **database yang sama** dengan API dashboard (`tkbj_admin`). Apa pun yang dilakukan pengunjung di aplikasi langsung masuk ke antrean admin, dan sebaliknya:

| Aksi di aplikasi | Masuk ke dashboard | Keputusan admin | Kembali ke aplikasi |
|---|---|---|---|
| Checkout tiket | Menu **Transaksi**: pesanan `TK-MMYY-NNNN` berstatus *Menunggu bayar* | — | Booking `TKBJ-XXXXXX` di Tiket Saya |
| Unggah bukti bayar | Status menjadi *Perlu verifikasi*, plus lonceng & log aktivitas | Verifikasi / minta ulang | Notifikasi *dikonfirmasi* (e-tiket aktif) atau *unggah ulang* |
| Ajukan sewa + 3 berkas | Menu **Sewa gedung**: `SG-MMYY-NNNN` berstatus *Perlu ditinjau* | Setujui (tagihan dibuat) / tolak | Notifikasi, lalu bayar tagihan → *lunas* → bukti reservasi |
| Daftarkan komunitas | Menu **Komunitas**: *Menunggu persetujuan* | Setujui / tolak | Notifikasi, dan komunitas tampil di direktori |

Agenda, galeri, konten, fasilitas, dan profil lembaga dibaca dari tabel dashboard. Yang ditampilkan hanya data yang **Terpublikasi** atau **Aktif**.

API dashboard tidak mengenal akun pengunjung, jadi notifikasi atas keputusan admin dibuat di sini. Setiap tautan menyimpan `notified_status`. Saat aplikasi membuka notifikasi atau akun, status terkini dibandingkan dengan nilai itu, dan bila berubah, satu notifikasi ditambahkan ([`lib/status.ts`](src/lib/status.ts)). Backend dashboard tidak perlu diubah sama sekali.

### Tabel milik API mobile

| Tabel | Isi |
|---|---|
| `visitors` | Akun pengunjung (email + bcrypt). Terpisah dari `users` karena staf memakai username dan peran |
| `visitor_sessions` | Satu baris per login; logout mengisi `revoked_at` |
| `visitor_orders` | Pemilik pesanan di `orders`, kode booking, kontak pemesan |
| `visitor_rentals` | Pemilik sewa di `rentals` beserta nomor kontak |
| `visitor_communities` | Pendaftar komunitas di `communities`, alamat, deskripsi |
| `visitor_files` | Metadata berkas privat (KTP, surat, proposal, bukti transfer) |
| `visitor_notifications` | Notifikasi akun (`target` sama dengan enum `NotificationTarget` di Flutter) |

Tabel tautan sengaja **tanpa foreign key ke tabel dashboard**, karena id pesanan atau sewa bisa dipakai ulang setelah data contoh di-seed ulang. Semua tabel ini didefinisikan di [`backend/admin-dashboard/prisma/schema.prisma`](../admin-dashboard/prisma/schema.prisma) dan dibuat oleh migration Prisma di sana.

Kalau skema berubah, jalankan `npm run prisma:sync` di folder ini. Perintah itu menyalin skema lalu membuat ulang Prisma Client, dan sebuah test memastikan salinannya tidak usang.

## Menjalankan

```bash
# 0. Dashboard dulu: skema & data contoh tabel dashboard
cd backend/admin-dashboard
npm install && npm run migrate && npm run seed     # migration Prisma untuk SELURUH tabel

# 1. API mobile
cd ../mobile-app
npm install              # juga menjalankan `prisma generate` (postinstall)
cp .env.example .env     # Windows: copy .env.example .env
npm run migrate          # = npm run migrate di backend dashboard (skema satu sumber)
npm run seed             # akun demo + tautan ke data contoh dashboard
npm run dev              # http://localhost:5001/api
```

Port **5001**, supaya bisa berjalan bersamaan dengan API dashboard (5000). Dari emulator Android, alamatnya `http://10.0.2.2:5001/api`. Dari HP di Wi-Fi yang sama, pakai IP laptop. Untuk akses dari luar, pakai Ngrok: `ngrok http 5001`.

Setelah `npm run seed` di dashboard (data contoh dikembalikan), jalankan juga `npm run seed` di sini agar tautan akun demo kembali benar.

### Akun demo

| Email | Kata sandi | Isi |
|---|---|---|
| `budi.santoso@email.com` | `tkbj2026` | Booking `TKBJ-A1B2C3` (TK-1026-0127, menunggu verifikasi), sewa SG-1026-0014 (ditinjau) & SG-1026-0017 (disetujui, belum bayar), komunitas Sanggar Sekar Arum (menunggu) |
| `sari.wulandari@email.com` | `tkbj2026` | Akun kosong, untuk menguji isolasi data |

Untuk mencoba alurnya, masuk ke dashboard sebagai `admin` / `admin123`, lalu verifikasi pembayaran TK-1026-0127 atau setujui Sekar Arum. Notifikasinya akan muncul di `GET /api/notifications` milik Budi.

## Endpoint

Semua respons berformat JSON. Error validasi dikirim sebagai `400 { error, fields: { kolom: pesan } }`. Rute bertanda 🔒 wajib `Authorization: Bearer <token>`.

**Publik**

| Method & path | Keterangan |
|---|---|
| `GET /health` · `GET /api/health` | Health check: 200 bila server hidup **dan** MySQL bisa dihubungi, 503 bila database putus atau sedang graceful shutdown |
| `GET /api/meta` | Kategori acara/komunitas, slot sewa, dokumen wajib, metode bayar, batas tiket, rekening |
| `GET /api/home` | Profil singkat, banner, 4 agenda terdekat, 3 berita terbaru |
| `GET /api/profile` · `GET /api/facilities` | Profil lembaga & fasilitas (tarif sewa, bisa disewa atau tidak) |
| `GET /api/events?from=&to=&category=&q=&ticketed=1&all=1` | Kalender acara terpublikasi (bawaan mulai hari ini) |
| `GET /api/events/:id` | Detail acara: harga, kuota, `remaining` |
| `GET /api/gallery?type=&collection=` · `/gallery/collections` · `/gallery/:id` | Virtual galeri |
| `GET /api/contents?type=` · `/contents/:id` | Berita, pengumuman, artikel budaya |
| `GET /api/communities?category=&q=` · `/communities/:id` | Direktori komunitas aktif |
| `GET /api/rentals/availability?facilityId=&month=YYYY-MM` | Kalender sewa: tiap slot `available` / `full` / `past` |
| `POST /api/assistant/chat` | **Tanya Krida (asisten AI)**: `{ messages: [{ role: 'user' \| 'assistant', content }] }` → `{ reply, links: [{ kind, id?, label }], suggestions }`. Lihat [Tanya Krida](#tanya-krida-asisten-ai) |
| `POST /api/auth/register` | `{ name, email, phone, password, confirm?, city? }` menghasilkan token dan langsung masuk |
| `POST /api/auth/login` | `{ email, password }` menghasilkan `{ token, expiresIn, user }`. Akun dikunci 15 menit setelah 5 kali gagal; maksimal 20 percobaan gagal per IP per 15 menit (`rateLimiter.ts`) |

**Akun** 🔒

| Method & path | Keterangan |
|---|---|
| `GET /api/auth/me` | Profil + ringkasan (booking, sewa, komunitas, notifikasi belum dibaca) |
| `PUT /api/auth/me` | Edit profil `{ name, email, phone, city }` |
| `PUT /api/auth/password` | `{ current, password, confirm? }`. Password baru wajib memuat huruf besar, huruf kecil, dan angka. Sesi di perangkat lain ikut dicabut |
| `POST /api/auth/logout` | Mencabut sesi token |
| `GET /api/notifications` | `{ unread, items }`, setelah keputusan admin disinkronkan |
| `POST /api/notifications/:id/read` · `/notifications/read-all` | Tandai dibaca |
| `GET /api/files/:id` | Unduh berkas milik sendiri |

**Tiket** 🔒

| Method & path | Keterangan |
|---|---|
| `POST /api/tickets/checkout` | `{ items: [{ eventId, qty }], buyer?: { name, email, phone } }`. Satu pesanan per acara, satu kode booking |
| `GET /api/tickets` · `/tickets/:code` | Tiket Saya / E-Tiket (`ticketCodes` terisi setelah lunas) |
| `POST /api/tickets/:code/payment` | Multipart: `file` (JPG/PNG/WEBP/PDF ≤ 5 MB), `method` (QRIS / Virtual Account / E-Wallet / Transfer bank), `sender?` |

**Sewa gedung** 🔒

| Method & path | Keterangan |
|---|---|
| `POST /api/rentals` | Multipart: `facilityId`, `date`, `slot` (`morning`/`afternoon`/`evening`), `activity`, `applicant`, `contact`, serta berkas `ktp`, `surat`, `proposal` |
| `GET /api/rentals` · `/rentals/:id` | Riwayat & status (`pending`/`approved`/`paid`/`rejected`, sama dengan enum `RentalStatus` di Flutter), tagihan, dan dokumen |
| `POST /api/rentals/:id/payment` | Bayar tagihan yang sudah disetujui (multipart sama dengan pembayaran tiket) |

**Komunitas** 🔒

| Method & path | Keterangan |
|---|---|
| `POST /api/communities` | `{ name, category, leader, phone, address, description, city?, members?, foundedYear? }` |
| `GET /api/me/communities` | Pendaftaran milik sendiri beserta status dan catatan admin |

## Aturan bisnis & keamanan

- **Kuota tiket tidak bisa terlampaui.** Sisa kursi dihitung dari kuota − terjual − tiket yang sedang diverifikasi − tiket belum dibayar yang masih dalam batas bayar (Pengaturan dashboard → *Batas bayar*). Baris acara dikunci (`FOR UPDATE`) selama checkout. Batas tiket per acara juga mengikuti Pengaturan.
- **Jadwal sewa tidak bisa ganda.** Slot dianggap terisi bila beririsan dengan acara atau sewa lain yang masih ditinjau maupun sudah disetujui. Baris fasilitas dikunci selama pengajuan, sehingga dua pengajuan bersamaan tidak bisa sama-sama lolos.
- **Tarif sewa** sama dengan `RENTAL_RATES` di dashboard ([`lib/catalog.ts`](src/lib/catalog.ts)). Kalau tarif diubah, ubah di kedua backend.
- **Isolasi data (anti-IDOR):** semua query milik pengguna memakai `visitor_id` dari sesi. Data milik orang lain dibalas **404**.
- **Token terpisah dari staf:** JWT pengunjung memakai klaim `aud: tkbj-mobile` dan tabel `visitor_sessions`, jadi token dashboard ditolak di sini, dan sebaliknya.
- **Berkas privat:** KTP, surat, dan bukti transfer disimpan di **Vercel Blob** (`access: private`) bila `BLOB_READ_WRITE_TOKEN` diisi, atau dengan nama acak di `UPLOADS_DIR`. Berkas **tidak disajikan statis**: hanya bisa diunduh pemiliknya, dan admin membukanya lewat API dashboard yang memeriksa peran. Tipe berkas dicek dari *magic number*. Kalau penyimpanan ke database gagal, berkasnya ikut dihapus.

## Tanya Krida (asisten AI)

Fitur AI aplikasi mobile. Pengunjung bertanya dengan bahasa sehari-hari, lalu AI menjawab **dari database yang sama dengan dashboard dan dari materi budaya aplikasi**, bukan dari karangan. Contoh pertanyaan: *"Apa itu Taman Krida Budaya?"*, *"Ceritakan sejarah Tari Remo"*, *"Ada wayang minggu depan?"*, *"Pendopo kosong tanggal 20?"*.

```
Flutter (layar chat) ──► POST /api/assistant/chat ──► Google Gemini API
                              │      ▲                      │ "panggil alat cari_acara / materi_budaya"
                              │      └── kirim_jawaban ◄────┤
                              └─► alat baca-saja (src/lib/assistantTools.ts) → MySQL & materi budaya
```

- **Model AI:** **Google Gemini**, kunci gratis dari [Google AI Studio](https://aistudio.google.com/apikey), SDK resmi `@google/genai`, model bawaan `gemini-3.5-flash-lite` ([`src/lib/ai/gemini.ts`](src/lib/ai/gemini.ts)). Jawaban akhir diserahkan model lewat alat penutup `kirim_jawaban`.
- **Controller:** [`src/controllers/assistantController.ts`](src/controllers/assistantController.ts). Model memilih alat (*function calling*), server menjalankannya, hasilnya dikirim balik, berulang sampai model menjawab (maks. 5 putaran; putaran terakhir dipaksa menjawab). Instruksi (system prompt) dan bentuk jawaban: [`src/lib/assistantPrompt.ts`](src/lib/assistantPrompt.ts).
- **Alat** ([`src/lib/assistantTools.ts`](src/lib/assistantTools.ts)), semuanya **hanya membaca data publik**:

  | Alat | Isi |
  |---|---|
  | `cari_acara` | Acara terpublikasi (filter tanggal, kategori, kata kunci): jam, lokasi, harga, sisa kursi |
  | `info_fasilitas` | Venue, kapasitas, bisa disewa atau tidak, tarif |
  | `cek_jadwal_sewa` | Slot Pagi/Siang/Malam per tanggal atau tanggal kosong sebulan (logika sama dengan `GET /rentals/availability`) |
  | `cari_komunitas` | Komunitas aktif di direktori |
  | `info_layanan` | Profil & kontak, aturan tiket (batas, batas bayar, pembatalan), alur & berkas sewa, 3 berita terbaru |
  | `materi_budaya` | Tentang TKBJ dan sejarah, linimasa, serta makna kesenian: Tari Remo, Topeng Malangan, Gandrung, Beskalan, Jaranan & Reog, Ludruk, Ketoprak, Wayang Kulit, Gamelan, Arsitektur Joglo |

- **Materi budaya** ada di [`src/lib/cultureKnowledge.ts`](src/lib/cultureKnowledge.ts). Materi yang juga ada di Edukasi Budaya aplikasi memakai id yang sama, sehingga jawaban konsisten dan AI bisa memberi tombol *Baca materi*. Topik di luar materi boleh dijawab dari pengetahuan umum model, tetapi AI diminta tidak mengarang tahun atau nama. **Tanggal pendirian TKBJ sengaja belum diisi** karena belum ada sumber resmi; lengkapi entri `tkbj` bila sudah ada data dari pengelola.
- **Jawaban terstruktur:** `jawaban`, `tautan` (tombol ke layar aplikasi), dan `saran_pertanyaan`. Id tombol **dicek ulang ke database atau materi** dan labelnya dibuat server, jadi tombol tidak pernah mengarah ke acara atau materi yang tidak ada.
- **Keamanan & kuota:** kunci API hanya di `.env` server, tidak pernah dikirim ke aplikasi. Tidak ada alat yang membaca data akun atau mengubah database. Riwayat dibatasi 12 pesan terakhir, pertanyaan ≤ 500 karakter, dan ada pembatas per IP (`AI_RATE_LIMIT_MAX`, bawaan 20 pertanyaan/15 menit). Error API AI dibalas pesan umum (kunci salah → 503, kuota habis → 429, gangguan → 502), detailnya hanya di log. Jawaban yang diblokir pengaman model dibalas pesan sopan.
- **Kuota gratis Gemini** dihitung per proyek Google dan per hari. Satu pertanyaan biasanya memakai 2–3 permintaan ke Gemini (panggil alat, lalu jawab). Bila kuota habis, pengguna mendapat pesan *"Kuota Tanya Krida sedang habis"* dan fitur lain tetap jalan. Catatan privasi: di tier gratis, Google dapat memakai isi permintaan untuk meningkatkan produknya, jadi AI tidak pernah diberi data pribadi.
- **Konfigurasi** (`.env`): `GEMINI_API_KEY` (awalan `AQ.` atau `AIza`; kosong = fitur nonaktif, endpoint 503) dan `AI_MODEL` (kosong = `gemini-3.5-flash-lite`).
- **Test** memakai server tiruan Gemini (tanpa kunci asli dan tanpa kuota): memeriksa loop alat, hasil alat dari database dan materi budaya, *thought signature* Gemini, riwayat percakapan, penggantian model, putaran terakhir yang dipaksa menjawab, validasi tombol, pemblokiran, kuota habis, kunci salah, dan validasi input.

## Keamanan, error & logging

Sama dengan API dashboard (lihat README `backend/admin-dashboard`, bagian *Keamanan, error & logging*). Urutan middleware di `src/app.ts`: **request logger → Helmet → CORS → rate limiter → parser body → routes → 404 → error handler**.

- **Helmet** memasang header keamanan; `X-Powered-By` dimatikan.
- **CORS** (hanya berpengaruh ke Flutter web): `CORS_ORIGINS` kosong = semua origin saat development, tidak ada origin browser bila `NODE_ENV=production`. Aplikasi Android/iOS tidak terkena CORS.
- **Rate limit** (`src/middleware/rateLimiter.ts`): umum `/api` 300 permintaan/15 menit per IP (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MIN`), login 20 gagal/15 menit per IP + kunci akun 5 kali gagal, registrasi 10/jam → **429** + `Retry-After`. Di belakang Ngrok, `TRUST_PROXY=loopback` (bawaan) membuat batas dihitung per IP pengguna.
- **Status error:** input salah **400**, belum login/token salah **401**, data milik orang lain atau tidak ada **404** (anti-IDOR), rute tak dikenal **404**, error tak terduga **500** dengan pesan umum (stack hanya di log).
- **Logging** (`src/logger.ts`, `src/middleware/requestLogger.ts`, pino + pino-http): satu baris per permintaan dengan `requestId`, method, path tanpa query, status, dan durasi. Header, body, dan query tidak dicatat; password/token disensor. Header `X-Request-Id` dan field `requestId` di respons error memakai ID yang sama dengan log. `LOG_LEVEL` mengatur level log.

## Pengujian

```bash
npm run typecheck
npm test     # 33 test end-to-end, database terpisah: tkbj_mobile_test
```

Test mengimpor API dashboard yang asli dari `../admin-dashboard`, jadi folder itu juga harus sudah `npm install`. Dashboard dipakai untuk membuat skema dan data contoh, serta untuk keputusan admin: memverifikasi atau menolak bukti, menyetujui atau menolak sewa, dan menyetujui komunitas. Dengan begitu alur aplikasi → dashboard → aplikasi teruji utuh. Ada juga test untuk validasi, kuota, jadwal bentrok, anti-IDOR, berkas palsu, logout, dan ganti kata sandi.

## Integrasi Flutter

Aplikasi [`mobile-app`](../../mobile-app) sudah memakai API ini lewat *remote data source* per fitur (`lib/data/datasources/remote/`, mis. `RentalRemoteDataSourceImpl`) yang dirakit di `lib/injection.dart`. Alamatnya bawaan `http://10.0.2.2:5001/api` (emulator Android) atau `http://localhost:5001/api`, dan bisa diganti dengan `--dart-define=API_URL=...`. Token login disimpan di perangkat. Tanpa server, aplikasi bisa dijalankan dengan `--dart-define=DEMO_MODE=true`.

Hal yang mengikuti dashboard:

- **Kategori komunitas** mengikuti dashboard (`Seni tari tradisional`, `Seni pertunjukan`, `Seni musik`, `Seni kriya`) dan diambil dari `GET /api/meta`.
- **Tarif sewa** dihitung per pemakaian (tarif dashboard), bukan per jam × durasi.
- **Pembayaran** berupa unggah bukti lalu diverifikasi admin, bukan lunas instan. Ini sesuai alur Transaksi di dashboard dan rancangan fitur AI verifikasi bukti.
- **Foto:** `photo` berisi kunci foto bawaan (`wayang`, `topeng`, `ketoprak`) yang dipetakan ke aset aplikasi. `url` adalah foto yang diunggah admin, disajikan oleh API dashboard (`ADMIN_PUBLIC_URL`).

Yang belum ada:

- **Lupa kata sandi** belum punya endpoint karena belum ada layanan email.
- **Berkas privat belum bisa dibuka admin.** Dashboard hanya menampilkan label berkas, karena berkasnya ada di folder privat API mobile. Perlu endpoint khusus staf bila admin harus membuka KTP atau bukti transfer.
