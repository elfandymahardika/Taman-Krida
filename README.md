# Sistem Informasi Taman Krida Budaya Jawa Timur (TKBJ)

Prototipe UTS Frontend Development. Satu rancangan sistem dengan dua antarmuka:

| Folder | Antarmuka | Pengguna | Teknologi |
|---|---|---|---|
| [`admin-dashboard/`](admin-dashboard) | **Dashboard Web** | Administrator TKBJ | Next.js 16 (React 19) |
| [`mobile-app/`](mobile-app) | **Mobile Application** | Pengunjung / pengguna akhir | Flutter |

TKBJ adalah pusat seni dan budaya Jawa Timur di Kota Malang, di bawah Disbudpar Provinsi Jawa Timur. Pengunjung memakai aplikasi mobile untuk melihat agenda, membeli tiket pertunjukan, dan mengajukan sewa gedung. Admin memakai dashboard web untuk mengelola acara, tiket, sewa, dan pembayaran.

Kedua aplikasi memakai **data dummy** (tanpa database).

## Menjalankan

```bash
# Dashboard Web
cd admin-dashboard
npm install
npm run dev          # http://localhost:3000 · akun: admin / admin123

# Mobile App
cd mobile-app
flutter pub get
flutter run          # akun: budi.santoso@email.com / tkbj2026
```

Panduan lengkap, daftar library, dan screenshot ada di README masing-masing folder:

- [admin-dashboard/README.md](admin-dashboard/README.md)
- [mobile-app/README.md](mobile-app/README.md)

## Rancangan fitur AI

**Asisten Verifikasi Bukti Pembayaran.** Pengguna mengunggah foto bukti transfer dari aplikasi mobile. AI (OCR / vision model) membaca nominal, pengirim, dan tanggal, mencocokkannya dengan tagihan, lalu memberi saran beserta skor keyakinan kepada admin di dashboard web. Keputusan akhir tetap di tangan admin. Fitur ini belum diimplementasikan; rinciannya ada di kedua README.
