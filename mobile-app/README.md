# TKBJ Mobile — Aplikasi Pengunjung

Prototipe **Mobile Application untuk pengguna akhir** Taman Krida Budaya Jawa Timur (TKBJ), dibuat dengan **Flutter** untuk tugas Ujian Tengah Semester (UTS).

Aplikasi ini adalah pasangan dari [Dashboard Web admin](../admin-dashboard) dalam satu rancangan sistem. Pengunjung dapat:

- melihat profil & denah TKBJ dan kalender acara;
- memesan tiket pertunjukan sampai pembayaran (simulasi);
- mengajukan sewa gedung lewat 5 langkah, sampai bukti reservasi;
- menjelajah Virtual Galeri, Direktori Komunitas, dan Edukasi Budaya;
- mengelola tiket, riwayat sewa, profil, dan notifikasi di akun mereka.

Tampilan mengikuti desain Figma tim ([Highfi-Taman-Krida](https://www.figma.com/design/arjM0e1ApzkZ58oERTzCa8/Highfi-Taman-Krida), halaman **mobile**, frame 390 px).

**Data dari backend.** Aplikasi tersambung ke [`backend/mobile-app`](../backend/mobile-app), yang memakai database yang sama dengan Dashboard Web:

- Agenda, fasilitas, galeri, dan komunitas yang tampil adalah data yang dipublikasikan admin.
- Pesanan tiket, bukti pembayaran, pengajuan sewa (beserta berkasnya), dan pendaftaran komunitas langsung masuk ke antrean admin.
- Keputusan admin (lunas, disetujui, ditolak) kembali ke aplikasi sebagai status dan notifikasi.

Untuk presentasi tanpa server ada **mode demo** yang memakai data contoh di memori (lihat [Panduan menjalankan](#panduan-menjalankan-aplikasi)).

---

## Pemenuhan ketentuan UTS

| Ketentuan | Implementasi |
|---|---|
| Halaman login (simulasi) | `LoginScreen`: validasi email & kata sandi, pesan "email belum terdaftar" / "kata sandi salah", tombol isi akun demo, sheet **Lupa Kata Sandi**. Halaman **Daftar Akun** juga tersedia. |
| Halaman utama | `HomeScreen`: hero, tentang TKBJ, 7 kartu fitur utama yang semuanya bisa dibuka. |
| Form input | Login, Daftar Akun, Lupa Kata Sandi, **Data Pemesan** (checkout), **Formulir Kegiatan** & **Unggah Berkas** (sewa gedung), **Daftarkan Komunitas**, Edit Profil. |
| Halaman yang menampilkan data / hasil input | Kalender & detail acara, galeri, komunitas, materi edukasi, **E-Tiket**, **Tiket Saya**, **Status Pengajuan**, **Bukti Reservasi**, **Riwayat Sewa**, **Notifikasi**, Akun Saya. Data yang diisi di form langsung muncul di halaman ini. |
| Navigasi antarhalaman | 32 rute bernama (`lib/routes/app_routes.dart`), menu navigasi layar penuh, breadcrumb, rute akun yang dilindungi login (otomatis diarahkan ke halaman Masuk). |
| Validasi sederhana | Wajib isi, format email, nomor WhatsApp `08…` 10–13 digit, kata sandi ≥ 8 karakter dengan huruf besar, huruf kecil & angka (sama dengan server), persetujuan ketentuan, keranjang tidak boleh kosong, jumlah tiket 0–4, **tanggal/slot venue penuh**, **3 berkas sewa wajib diunggah**, kategori komunitas wajib dipilih, deskripsi ≥ 20 karakter. |
| Data dummy | `lib/data/dummy/` (acara, fasilitas, galeri, komunitas, materi edukasi, akun, pesanan, pengajuan sewa, notifikasi). |
| Rancangan AI | Lihat [Rancangan Fitur AI](#rancangan-fitur-ai). |

### Akun demo

| Email | Kata sandi |
|---|---|
| `budi.santoso@email.com` | `tkbj2026` |

Tekan **Pakai** pada kotak akun demo di halaman Masuk untuk mengisi form otomatis. Akun baru dari halaman Daftar juga bisa dipakai selama aplikasi berjalan.

---

## Panduan menjalankan aplikasi

Prasyarat: **Flutter 3.x** (diuji dengan Flutter 3.47.1 / Dart 3.13), serta emulator Android, perangkat Android, atau Chrome.

```bash
# 0. Nyalakan backend dulu (MySQL/XAMPP harus menyala), lihat README root:
#    backend/admin-dashboard (port 5000) lalu backend/mobile-app (port 5001)

# 1. Pasang dependensi
cd mobile-app
flutter pub get

# 2. Jalankan (pilih perangkat yang tersedia)
flutter run            # emulator Android → otomatis memanggil http://10.0.2.2:5001/api
flutter run -d chrome  # browser → http://localhost:5001/api
```

**Alamat server lain**, misalnya HP sungguhan di Wi-Fi yang sama atau Ngrok:

```bash
flutter run --dart-define=API_URL=http://192.168.1.10:5001/api
flutter run --dart-define=API_URL=https://xxxx.ngrok-free.app/api
```

**Mode demo tanpa server**: data contoh di memori. Di mode ini keputusan admin bisa disimulasikan lewat tombol di layar status.

```bash
flutter run --dart-define=DEMO_MODE=true
```

Akun demo `budi.santoso@email.com` / `tkbj2026` berlaku di kedua mode, karena sama dengan seeder backend.

Proyek juga bisa dibuka di **Android Studio** (plugin Flutter): File → Open → pilih folder `mobile-app`, lalu Run.

### Build

```bash
flutter build apk --release   # hasil: build/app/outputs/flutter-apk/app-release.apk
flutter build web             # hasil: build/web/
```

### Pengujian

```bash
flutter analyze   # analisis statis (lint)
flutter test      # 152 test: unit, alur fitur, dan responsif (memakai mode demo, tanpa server)
```

**Uji terhadap server sungguhan** (`test/live_api_test.dart`, dilewati bila alamat tidak diisi). Test ini memakai API dashboard untuk keputusan admin, sehingga mencakup:

- data publik dan kalender ketersediaan;
- login dan sesi tersimpan;
- checkout tiket → bukti bayar → diverifikasi admin → e-tiket;
- pengajuan sewa + 3 berkas → disetujui → bayar → lunas;
- pendaftaran komunitas.

Jalankan di database berisi data contoh (`npm run seed` di kedua backend), karena test ini membuat data baru:

```powershell
$env:TKBJ_API_URL='http://localhost:5001/api'; $env:TKBJ_ADMIN_URL='http://localhost:5000/api'
flutter test test/live_api_test.dart
```

- `test/widget_test.dart` dan `test/feature_flows_test.dart` menguji alur login, checkout tiket, sewa gedung (ajukan → disetujui/ditolak → bayar), validasi unggah berkas, daftar komunitas, filter galeri, dan notifikasi.
- `test/responsive_test.dart` merender **34 layar** pada 4 ukuran (320×568, 430×932, landscape 844×390, tablet 1024×768) dan gagal jika ada *overflow*.

Screenshot di bawah dibuat otomatis dengan:

```bash
flutter test test_screenshots --update-goldens
```

---

## Library / package yang digunakan

| Package | Versi | Kegunaan |
|---|---|---|
| [flutter](https://flutter.dev) (SDK) | 3.47.1 | Framework UI |
| [flutter_svg](https://pub.dev/packages/flutter_svg) | 2.3.0 | Menampilkan ikon & logo SVG hasil ekspor Figma |
| [http](https://pub.dev/packages/http) + [http_parser](https://pub.dev/packages/http_parser) | 1.6 / 4.1 | Memanggil REST API (JSON & multipart unggah berkas) |
| [file_picker](https://pub.dev/packages/file_picker) | 13.3 | Memilih berkas sewa (KTP, surat, proposal) & bukti pembayaran |
| [shared_preferences](https://pub.dev/packages/shared_preferences) | 2.5 | Menyimpan token login agar tetap masuk setelah aplikasi ditutup |
| flutter_test (SDK, dev) | — | Unit test & widget test |
| [flutter_lints](https://pub.dev/packages/flutter_lints) (dev) | 6.0.0 | Aturan lint |

**Aset**

| Aset | Sumber |
|---|---|
| Ikon SVG (`assets/icons/`) dan foto (`assets/images/`) | Diekspor dari desain Figma |
| Font Poppins & Playfair Display | Google Fonts (OFL), dibundel agar tampil sama tanpa internet |
| `TkbjSymbolsMath.ttf`, `TkbjSymbols2.ttf` | Subset Noto Sans Math & Noto Sans Symbols 2 (OFL), hanya berisi simbol desain: ◆ ◇ ◈ ◉ ▣ ▲ ● ▶ ✦ ❖ ✓ ✕ ☀ ✎ → ← ↑ ▾ |

State management memakai `ChangeNotifier` + `InheritedNotifier` bawaan Flutter (tanpa package tambahan).

---

## Screenshot

**Beranda, akun, profil & acara**

| Beranda | Menu navigasi | Masuk | Daftar akun |
|---|---|---|---|
| <img src="docs/screenshots/01-beranda.png" width="200"> | <img src="docs/screenshots/02-menu-navigasi.png" width="200"> | <img src="docs/screenshots/03-masuk.png" width="200"> | <img src="docs/screenshots/04-daftar-akun.png" width="200"> |

| Profil & denah | Kalender acara | Detail acara | Pesan tiket |
|---|---|---|---|
| <img src="docs/screenshots/05-profil-denah.png" width="200"> | <img src="docs/screenshots/06-kalender-acara.png" width="200"> | <img src="docs/screenshots/07-detail-acara.png" width="200"> | <img src="docs/screenshots/08-tiket-pertunjukan.png" width="200"> |

**Checkout tiket**

| 1. Data pemesan | 2. Metode bayar | 3. Konfirmasi QRIS | 4. E-tiket |
|---|---|---|---|
| <img src="docs/screenshots/09-checkout-data-pemesan.png" width="200"> | <img src="docs/screenshots/10-checkout-metode-bayar.png" width="200"> | <img src="docs/screenshots/11-checkout-konfirmasi.png" width="200"> | <img src="docs/screenshots/12-checkout-berhasil.png" width="200"> |

**Sewa gedung (5 langkah + hasil verifikasi)**

| 1. Pilih venue | 2. Cek jadwal | 3. Formulir | 4. Unggah berkas |
|---|---|---|---|
| <img src="docs/screenshots/13-sewa-pilih-venue.png" width="200"> | <img src="docs/screenshots/14-sewa-cek-jadwal.png" width="200"> | <img src="docs/screenshots/15-sewa-formulir.png" width="200"> | <img src="docs/screenshots/16-sewa-unggah-berkas.png" width="200"> |

| 5. Status verifikasi | Ditolak | Pembayaran sewa | Bukti reservasi |
|---|---|---|---|
| <img src="docs/screenshots/17-sewa-status-verifikasi.png" width="200"> | <img src="docs/screenshots/18-sewa-ditolak.png" width="200"> | <img src="docs/screenshots/19-sewa-pembayaran.png" width="200"> | <img src="docs/screenshots/20-sewa-bukti-reservasi.png" width="200"> |

**Galeri & komunitas**

| Virtual galeri | Detail galeri | Direktori komunitas | Detail komunitas |
|---|---|---|---|
| <img src="docs/screenshots/21-virtual-galeri.png" width="200"> | <img src="docs/screenshots/22-galeri-detail.png" width="200"> | <img src="docs/screenshots/23-direktori-komunitas.png" width="200"> | <img src="docs/screenshots/24-komunitas-detail.png" width="200"> |

**Edukasi budaya**

| Daftarkan komunitas | Daftar materi | Tab sejarah | Tab filosofi |
|---|---|---|---|
| <img src="docs/screenshots/25-daftar-komunitas.png" width="200"> | <img src="docs/screenshots/26-edukasi-budaya.png" width="200"> | <img src="docs/screenshots/27-edukasi-sejarah.png" width="200"> | <img src="docs/screenshots/28-edukasi-filosofi.png" width="200"> |

**Akun pengguna**

| Tab foto/video | Akun saya | Tiket saya | Riwayat sewa |
|---|---|---|---|
| <img src="docs/screenshots/29-edukasi-foto-video.png" width="200"> | <img src="docs/screenshots/30-akun-saya.png" width="200"> | <img src="docs/screenshots/31-tiket-saya.png" width="200"> | <img src="docs/screenshots/32-riwayat-sewa.png" width="200"> |

| Edit profil | Notifikasi |
|---|---|
| <img src="docs/screenshots/33-edit-profil.png" width="200"> | <img src="docs/screenshots/34-notifikasi.png" width="200"> |

---

## Alur utama

1. **Pesan tiket** (wajib masuk): Beranda → Kalender Acara (filter kategori & rentang waktu) → Detail Acara → *"Ingin memesan tiket?"* → Pesan Tiket (stepper 0–4, dibatasi sisa kuota) → Data Pemesan → Metode Bayar (QRIS / Virtual Account / E-Wallet) → Konfirmasi.
   - Di Konfirmasi, unggah **bukti pembayaran** lalu tekan *Pesan & Kirim Bukti*, atau pilih *Pesan Sekarang, Bayar Nanti*.
   - Pesanan masuk ke menu **Transaksi** dashboard dengan status *Menunggu pembayaran* → *Sedang diverifikasi*.
   - Setelah Admin Keuangan memverifikasi, statusnya menjadi **Lunas**, lalu **E-Tiket** dan kode tiket terbit di Tiket Saya.
2. **Sewa gedung:** Pilih Venue → Cek Jadwal → Formulir Kegiatan → Unggah Berkas → *Pengajuan terkirim* → **Status Verifikasi**.
   - Kalender ketersediaan diambil dari server: slot yang bentrok dengan acara atau sewa lain tampil *Penuh*.
   - Berkas yang diunggah adalah KTP, surat permohonan, dan proposal (PDF/JPG/PNG, maksimal 5 MB).
   - Admin Sewa memutuskan di dashboard:
     - **Disetujui** → Pembayaran Sewa (unggah bukti) → diverifikasi Admin Keuangan → **Bukti Reservasi**;
     - **Ditolak** → catatan admin → **Ajukan Ulang** (venue & nama kegiatan terisi otomatis).
3. **Virtual Galeri:** filter kategori → detail dengan tab Foto (geser foto, thumbnail) dan Video.
4. **Direktori Komunitas:** filter kategori → detail sanggar (statistik, jadwal latihan, kontak) → *Hubungi via WhatsApp*; atau **Daftarkan Komunitas** → *Pendaftaran terkirim* → notifikasi baru.
5. **Edukasi Budaya:** 6 materi → detail dengan tab **Sejarah** (linimasa), **Filosofi**, dan **Foto/Video**.
6. **Akun:** Masuk / Daftar → Akun Saya → Tiket Saya, Riwayat Sewa (tombol sesuai status), Edit Profil, **Notifikasi** (tandai dibaca, buka halaman terkait), Keluar.

Pemesanan tiket, pengajuan sewa, pendaftaran komunitas, dan setiap keputusan admin otomatis menambah notifikasi baru. Notifikasi dimuat ulang saat layar Akun, Notifikasi, Tiket Saya, Riwayat Sewa, atau status dibuka, dan bisa dimuat ulang manual dengan tombol *Muat Ulang Status*.

---

## Responsif

- Navbar tetap di atas; isi dan footer berada di dalam `SingleChildScrollView`, jadi tidak ada *bottom overflow* di ponsel kecil atau saat landscape.
- `ContentSection` membatasi lebar konten maksimal 720 px dan menaruhnya di tengah pada tablet/landscape, sementara latar section tetap selebar layar.
- `ResponsiveGrid` (berbasis `LayoutBuilder`) menyusun kartu 1 kolom di ponsel dan 2–4 kolom di layar lebar. Grid galeri: 2 kolom di ponsel.
- Kalender ketersediaan dan stepper sewa memakai kolom `Expanded` selebar sama; label stepper mengecil (`FittedBox`) di layar sempit.
- Pin peta denah memakai posisi relatif (0–1) terhadap ukuran peta, sehingga tetap di titik yang sama di semua lebar layar.
- Teks panjang memakai `Expanded`/`Flexible`, `maxLines` + ellipsis, dan `Wrap`.

---

## Rancangan Fitur AI

> Fitur ini **belum diimplementasikan**. Ini rencana pengembangan tahap berikutnya dan merupakan fitur AI yang sama dengan yang dijelaskan di [README Dashboard Web](../admin-dashboard/README.md#rancangan-fitur-ai).

### Asisten Verifikasi Bukti Pembayaran (sisi aplikasi mobile)

Pembayaran tiket dan sewa gedung lewat transfer bank harus dicocokkan admin secara manual dengan tagihan. Dengan AI, prosesnya menjadi:

1. Di layar konfirmasi pembayaran, pengguna **mengunggah foto bukti transfer** (kamera atau galeri).
2. Aplikasi mengirim foto ke backend. **OCR / vision model** membaca bank, nominal, nama pengirim, tanggal, dan nomor referensi.
3. Sistem mencocokkan hasilnya dengan tagihan (kode booking, total, nama pemesan) dan mendeteksi anomali, misalnya bukti dipakai ulang atau nominal tidak sesuai.
4. Pengguna langsung melihat status di **Tiket Saya / Riwayat Sewa** dan menerima **notifikasi**: *"Sedang diverifikasi"*, *"Lunas"*, atau *"Perlu unggah ulang: nominal tidak sesuai"*.
5. Admin di Dashboard Web melihat saran AI beserta skor keyakinannya dan tetap memegang **keputusan akhir**.

| Input (dari aplikasi) | Output (ke pengguna) |
|---|---|
| Foto bukti transfer + kode booking | Status verifikasi dan alasan singkat |
| Data tagihan pesanan | E-tiket / bukti reservasi terbit lebih cepat setelah dinyatakan lunas |

**Rencana teknologi:** `image_picker` di Flutter untuk mengambil foto, backend (Firebase Functions / Node.js) sebagai perantara ke layanan OCR atau model multimodal melalui API, dan notifikasi push saat status berubah.

**Etika & privasi:** AI hanya memberi saran. Foto bukti transfer disimpan terbatas dan hanya bisa diakses Admin Keuangan.

---

## Struktur proyek

```
mobile-app/
├── assets/
│   ├── fonts/        Poppins, Playfair Display, subset simbol Noto
│   ├── icons/        ikon & logo SVG dari Figma
│   └── images/       foto acara & fasilitas dari Figma
├── lib/
│   ├── main.dart                 entry point
│   ├── app.dart                  MaterialApp + AppStateScope
│   ├── core/
│   │   ├── constants/            path aset
│   │   ├── theme/                token warna, gaya teks, ThemeData
│   │   └── utils/                formatter rupiah/tanggal, validator, breakpoint, pemilih berkas
│   ├── data/
│   │   ├── api/                  ApiClient (HTTP, token, multipart, ApiException),
│   │   │                         Visuals (foto & posisi denah untuk data server)
│   │   ├── repository/           TkbjRepository: ApiRepository (backend/mobile-app)
│   │   │                         & DemoRepository (data contoh, test & mode demo)
│   │   ├── models/               acara, fasilitas, pesanan, pengajuan sewa, galeri,
│   │   │                         komunitas, materi edukasi, notifikasi, akun
│   │   └── dummy/                data contoh per fitur (dipakai DemoRepository)
│   ├── state/app_state.dart      data dari repository: katalog, sesi, keranjang,
│   │                             pesanan, sewa & ketersediaan, komunitas, notifikasi
│   ├── routes/app_routes.dart    nama rute, router, proteksi login
│   ├── widgets/                  komponen global yang dipakai ulang
│   │   ├── layout/               TkbjScaffold, navbar, footer, PageHeader, ContentSection, ResponsiveGrid
│   │   ├── common/               AppButton, AppCard, PillBadge, InfoRow, SectionCard, ReceiptCard,
│   │   │                         ArtworkImage, VideoPreview, bottom sheet & toast
│   │   ├── form/                 LabeledTextField, ReadOnlyField, UploadField, AppCheckbox
│   │   └── interactive/          ChipFilter(Bar), QtyStepper, StepTracker, SegmentedTabs, UnderlineTabs
│   └── screens/                  satu folder per fitur, widget khusus fitur di subfolder widgets/
│       ├── home/  menu/  auth/  profile/  events/  tickets/  checkout/
│       ├── rental/  gallery/  community/  education/  account/
├── test/                         unit, alur fitur, dan responsive test
└── test_screenshots/             generator screenshot README
```

## Catatan

- Status bar dan *home indicator* pada frame Figma adalah bingkai perangkat, sehingga tidak digambar ulang; aplikasi memakai status bar asli sistem operasi.
- **Masih simulasi:** kode QR & nomor Virtual Account (contoh; pembayaran dibuktikan lewat unggah bukti yang diverifikasi admin), tombol WhatsApp, pemutar video, dan *Lupa Kata Sandi* (belum ada layanan email). Pada **mode demo**, keputusan admin juga disimulasikan lewat tombol di layar status.
- **Edukasi Budaya** tetap memakai materi statis di aplikasi, karena dashboard belum punya modul materi edukasi.
- **Komunitas dari dashboard:** kategori mengikuti dashboard (*Seni tari tradisional, Seni pertunjukan, Seni musik, Seni kriya*). Jadwal latihan & jumlah pentas belum dikelola admin, jadi tampil "Hubungi pengurus" / "–". Foto kegiatan tidak diminta saat mendaftar karena server belum menyimpannya.
- **Tarif sewa** dihitung per pemakaian (tarif yang ditagihkan dashboard saat sewa disetujui), bukan per jam.
- **Foto yang belum diekspor dari Figma:** gamelan, latihan sanggar, dan jaranan. Batas akses Figma MCP (paket Starter) mencegah pengunduhan, sehingga aplikasi menampilkan sampul gradien maroon sebagai gantinya. Untuk memakai foto asli, ekspor dari Figma lalu simpan sebagai `assets/images/gamelan.png`, `assets/images/latihan-sanggar.png`, dan `assets/images/jaranan.png`; tidak perlu mengubah kode.
- "Hari ini" mengikuti server (`APP_TODAY` di backend, bawaan 2 Oktober 2026), agar data contoh tetap relevan. Mode demo memakai 1 Juni 2026, sesuai tanggal desain.
- Pada mode demo, data tersimpan di memori dan kembali ke data contoh saat aplikasi ditutup. Pada mode server, token login disimpan di perangkat, sehingga pengguna tetap masuk setelah aplikasi dibuka lagi.
