# Deployment, CI/CD & Produksi (CHECK POINT bagian 7)

## Arsitektur produksi

```
Internet ──► Nginx :80/:443  (reverse proxy + SSL/TLS — satu-satunya port terbuka)
               ├─ /          ──► dashboard  (Next.js standalone)  ──► admin-api  (Express :5000)
               └─ /mobile/   ──► mobile-api (Express :5001, API aplikasi Flutter)
                                    admin-api & mobile-api ──► db (MariaDB 10.11, volume db-data)
```

| Berkas | Isi |
|---|---|
| `backend/admin-dashboard/Dockerfile` | Image API dashboard (juga menjalankan migration) |
| `backend/mobile-app/Dockerfile` | Image API aplikasi mobile |
| `frontend/admin-dashboard/Dockerfile` | Image panel admin (Next.js `output: 'standalone'`) |
| `deploy/docker-compose.yml` | Seluruh stack: `db`, `admin-api`, `mobile-api`, `dashboard`, `nginx` (+ `migrate`, `seed`) |
| `deploy/nginx/default.conf` · `tls.conf.example` | Reverse proxy HTTP · versi HTTPS |
| `deploy/deploy.sh` | Rilis tanpa downtime + rollback otomatis |
| `.github/workflows/ci-cd.yml` | CI (lint, test, build) & CD (image, deploy) |

## 1. Docker: image kecil & aman (multi-stage build)

Tiap Dockerfile punya 3 tahap:

1. **deps** — `npm ci` (termasuk devDependencies untuk kompilasi);
2. **build** — `tsc` / `next build`, lalu `npm prune --omit=dev`;
3. **runtime** — hanya hasil build + dependency produksi, berjalan sebagai user `node` (bukan root).

Yang **tidak** ikut ke image: source `src/`, `test/`, `.env`/`.env.local`, `node_modules` lokal, TypeScript, ts-node,
nodemon (`.dockerignore` + multi-stage). CI memeriksa hal ini otomatis (langkah *Image tidak membawa rahasia/source*).

Proses dijalankan dengan `node …` langsung (bukan `npm start`) dan Compose memakai `init: true`, agar sinyal `SIGTERM`
dari Docker benar-benar sampai ke aplikasi (graceful shutdown).

### Build vs runtime environment

Satu image yang sama dipakai di development, staging, dan production; yang berbeda hanya environment saat container
dijalankan.

- `NEXT_PUBLIC_*` **dikunci permanen saat `next build`**. Karena itu alamat backend panel admin tidak lagi memakai
  `NEXT_PUBLIC_API_URL`, melainkan `API_URL` yang dibaca saat runtime (`src/lib/backend.ts`); `NEXT_PUBLIC_API_URL`
  hanya cadangan untuk `.env.local` lama.
- Rahasia (`DB_PASSWORD`, `JWT_SECRET`, `BLOB_READ_WRITE_TOKEN`, `GEMINI_API_KEY`) hanya ada di `deploy/.env` di server
  (di-*ignore* git) dan masuk ke container sebagai environment saat runtime — tidak pernah dipanggang ke image.

## 2. Nginx & `trust proxy`

Nginx menerima semua trafik, meneruskan `X-Forwarded-For`/`X-Forwarded-Proto`, membatasi ukuran unggahan (30 MB),
dan (dengan `tls.conf.example`) menangani SSL/TLS + redirect HTTP→HTTPS + HSTS.

Karena ada proxy di depan, kedua API memakai `app.set('trust proxy', config.trustProxy)` dengan **`TRUST_PROXY=1`**
di Docker (diset di Dockerfile & Compose): Express memercayai tepat satu hop proxy, sehingga `req.ip` = IP pengguna
asli. Tanpa ini, semua pengguna terlihat ber-IP sama (IP Nginx) dan rate limiter login akan memblokir semua orang
sekaligus. Untuk development lokal nilai bawaannya `loopback`.

## 3. Health check & zero-downtime

**Health check** — `GET /health` di kedua API (`src/lib/health.ts`):

- `200 {"status":"ok","database":"up","dbLatencyMs":3,...}` bila server hidup **dan** `SELECT 1` ke MySQL berhasil
  (batas 2 dtk);
- `503` bila database putus, atau server sedang dimatikan (*draining*).

Panel admin punya `GET /api/health` yang juga mengecek API dashboard, sehingga versi baru dengan `API_URL` salah
tidak lolos. Ketiganya dipakai `HEALTHCHECK` di Dockerfile, `depends_on: condition: service_healthy` di Compose,
dan `deploy.sh`.

**Graceful shutdown** — `src/server.ts` kedua API, saat menerima `SIGTERM` (atau `SIGINT`/Ctrl+C):

1. `/health` langsung 503 → tidak menerima trafik baru dari load balancer;
2. `server.close()` berhenti menerima koneksi baru tetapi **menunggu request yang sedang berjalan selesai**;
   koneksi keep-alive yang menganggur ditutup;
3. pool MySQL & Prisma ditutup rapi, proses keluar dengan kode 0 (log: `Server berhenti dengan rapi.`);
4. bila masih menggantung > `SHUTDOWN_TIMEOUT_MS` (10 dtk), proses dipaksa keluar. Compose memberi
   `stop_grace_period: 30s` sebelum `SIGKILL`.

**Rilis tanpa downtime** — `bash deploy/deploy.sh <tag>`:

1. `docker compose pull` image versi baru, lalu `docker compose run --rm migrate` (migration *expand*);
2. untuk tiap layanan: jalankan container versi baru **di samping** versi lama (`--scale svc=2`);
3. tunggu health check versi baru → `healthy`;
4. sehat → `nginx -s reload` (trafik ikut ke versi baru), lalu `docker stop` versi lama (SIGTERM → graceful
   shutdown); **gagal → container baru dihapus, versi lama tetap melayani (rollback aman)** dan rilis berhenti.

Endpoint lama dijaga tetap kompatibel (mis. `GET /api/orders` tanpa `?page` masih mengembalikan array), sehingga
dashboard versi lama tetap jalan bila API sudah versi baru.

## 4. Strategi migration database: expand-contract

Saat rilis, versi lama dan versi baru sempat berjalan bersamaan dengan **database yang sama**, jadi setiap migration
harus aman untuk kedua versi. Perubahan yang merusak dipecah menjadi beberapa rilis:

| Rilis | Fase | Contoh: mengganti kolom `orders.method` menjadi `payment_method` |
|---|---|---|
| 1 | **Expand** | Tambah kolom `payment_method` (nullable). Kode baru menulis ke **kedua** kolom, membaca kolom baru dengan cadangan kolom lama. Versi lama tetap jalan karena kolom lama masih ada. |
| 2 | **Migrate** | Salin data lama: `UPDATE orders SET payment_method = method WHERE payment_method IS NULL`. Kode hanya membaca kolom baru. |
| 3 | **Contract** | Setelah tidak ada lagi versi yang memakai kolom lama, baru hapus `method`. |

Aturan praktis untuk `prisma/migrations`:

- **Aman dalam satu rilis:** tambah tabel, tambah kolom *nullable* atau ber-`DEFAULT`, tambah index.
- **Harus dipecah expand-contract:** rename/hapus kolom atau tabel, ubah tipe kolom, kolom baru `NOT NULL` tanpa default.
- Migration selalu dibuat di development (`npm run prisma -- migrate dev --name x` di `backend/admin-dashboard`, lalu
  `npm run prisma:sync` di `backend/mobile-app`) dan di produksi hanya dijalankan `prisma migrate deploy`
  (`docker compose run --rm migrate`) — tidak pernah `migrate reset`.
- Rollback aplikasi = jalankan image lama (`bash deploy.sh <sha-lama>`); skema tidak perlu diturunkan karena fase
  expand kompatibel dengan versi lama.

## 5. CI/CD (GitHub Actions)

`.github/workflows/ci-cd.yml` berjalan pada setiap **Pull Request ke `main`** dan setiap **push/merge ke `main`**:

| Job | Isi |
|---|---|
| `backend` (admin-dashboard, mobile-app) | `npm ci` → lint (`npm run typecheck`) → `npm test` (MariaDB service) → `npm run build` |
| `frontend` | `npm ci` → `npm run lint` (oxlint) → `npm test` (Vitest) → `npm run build` |
| `flutter` | `flutter analyze` → `flutter test` |
| `docker` | Build ketiga image, jalankan seluruh stack Compose, migration, cek `/health` lewat Nginx, cek graceful shutdown (`SIGTERM`) |
| `publish` *(main saja)* | Push image ke GitHub Container Registry `ghcr.io/<owner>/tkbj-{admin-api,mobile-api,dashboard}:<sha>` + `latest` |
| `deploy` *(main saja, opsional)* | SSH ke server → `git pull` → `bash deploy/deploy.sh <sha>` |

Disarankan mengaktifkan *branch protection* `main` (Settings → Branches) dengan status check job di atas wajib
lolos sebelum merge.

### Mengaktifkan deploy otomatis

1. Server Linux dengan Docker + Compose plugin; `git clone` repo ke `/opt/tkbj`, lalu
   `cp deploy/.env.example deploy/.env` dan isi nilainya.
2. Bila paket GHCR privat: di server `docker login ghcr.io` dengan token `read:packages`.
3. Pertama kali: `cd deploy && docker compose up -d db && docker compose run --rm migrate && docker compose up -d`.
4. Di GitHub → Settings → Environments → buat `production` (boleh dengan *required reviewers* untuk persetujuan
   manual), lalu isi:
   - Variables: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH` (bawaan `/opt/tkbj`);
   - Secrets: `DEPLOY_SSH_KEY` (kunci privat khusus deploy), `DEPLOY_KNOWN_HOSTS` (hasil `ssh-keyscan <host>`).

Selama `DEPLOY_HOST` kosong, job `deploy` dilewati; CI dan publish image tetap berjalan.

## Perintah sehari-hari (di folder `deploy/`)

```bash
docker compose ps                         # status & health tiap container
docker compose logs -f admin-api          # log JSON (pino); cari requestId dari layar error
docker compose logs dashboard | grep web-vitals
docker compose run --rm migrate           # migration
bash deploy.sh <sha>                      # rilis / rollback ke versi tertentu
```

Aplikasi Flutter diarahkan ke produksi dengan `--dart-define=API_URL=https://<domain>/mobile/api`.
