# Spesifikasi Fitur & Hak Akses — Ruang Kerja Staf

Dokumen perencanaan Modul 02 (form, autentikasi DAL, mutasi data) dan Modul 03 (upload berkas) untuk Panel Administrator TKBJ.

Fitur lama panel (acara, tiket, sewa, transaksi, konten, dll.) adalah **data bersama** yang aksesnya diatur per peran (RBAC 5 peran, lihat `backend/admin-dashboard/README.md`). Dua fitur di bawah ini adalah **data milik pribadi** tiap staf, sehingga butuh isolasi data per `user_id`.

## 1. Catatan staf (Modul 02)

Catatan kerja pribadi staf, misalnya checklist gladi, ide acara, atau rekonsiliasi pembayaran.

### Data yang disimpan (tabel `notes`)

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | BIGINT auto increment | |
| `user_id` | BIGINT, FK → `users.id` (ON DELETE CASCADE) | **Wajib.** Diisi dari sesi login, tidak pernah dari form. |
| `title` | VARCHAR(100) | Wajib, 3–100 karakter |
| `content` | VARCHAR(500), boleh kosong | Maksimal 500 karakter |
| `status` | ENUM `Draf` · `Terpublikasi` · `Diarsipkan` | Bawaan `Draf` |
| `created_at`, `updated_at` | DATETIME(3), UTC | |

### Matriks hak akses

| Peran | Buat | Baca milik sendiri | Baca semua staf | Ubah/hapus milik sendiri | Ubah/hapus milik orang lain | Arsipkan (moderasi) |
|---|---|---|---|---|---|---|
| Belum login | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Staf (Admin Acara/Keuangan/Sewa/Konten) | ✅ | ✅ | ❌ | ✅ | ❌ (404, cegah IDOR) | ❌ (403 FORBIDDEN) |
| Administrator utama | ✅ | ✅ | ✅ (supervisi) | ✅ | ✅ | ✅ |

## 2. Dokumen staf (Modul 03)

Berkas kerja staf seperti surat, proposal, atau foto. File biner disimpan di storage (folder `uploads/` atau Vercel Blob), sedangkan database hanya menyimpan metadatanya.

### Data yang disimpan (tabel `documents`)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | CHAR(36) UUID | |
| `name` | VARCHAR(255) | Nama asli berkas |
| `file_key` | VARCHAR(500), unik | Kunci di storage (nama file acak / URL blob), dipakai backend untuk menghapus |
| `file_type` | VARCHAR(100) | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| `file_size` | INT | Byte, maksimal 5 MB |
| `url` | VARCHAR(1000) | Alamat tampil/unduh untuk frontend |
| `user_id` | BIGINT, FK → `users.id` (ON DELETE CASCADE) | Pemilik, diisi dari sesi |
| `created_at` | DATETIME(3), UTC | |

### Matriks hak akses

| Peran | Unggah | Lihat milik sendiri | Lihat semua | Hapus milik sendiri | Hapus milik orang lain |
|---|---|---|---|---|---|
| Belum login | ❌ (401) | ❌ | ❌ | ❌ | ❌ |
| Staf | ✅ | ✅ | ❌ | ✅ | ❌ (404, cegah IDOR) |
| Administrator utama | ✅ | ✅ | ✅ | ✅ | ✅ (moderasi) |

## Prinsip keamanan

- **Isolasi data:** query ubah/hapus selalu `WHERE id = ? AND user_id = ?`. Kecualinya hanya Administrator utama.
- **userId tidak pernah dari klien.** Server Action dan backend mengambilnya dari sesi (cookie HttpOnly → JWT → `res.locals.userId`).
- **Data milik orang lain dibalas 404, bukan 403,** supaya keberadaan ID milik user lain tidak bocor.
- **Validasi dua lapis:** schema Zod di Server Action (`frontend/admin-dashboard/src/lib/schemas.ts` & `src/lib/validation/auth.ts`), lalu `validator.ts` / Multer di backend. Validasi browser bisa dilewati, validasi server tidak.
