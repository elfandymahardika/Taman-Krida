# syntax=docker/dockerfile:1
#
# Image produksi API dashboard (Express + TypeScript), multi-stage build:
#   deps    → npm ci (termasuk devDependencies untuk kompilasi TypeScript)
#   build   → tsc ke dist/, lalu buang devDependencies (typescript, ts-node, nodemon, @types/*)
#   runtime → hanya dist/ + node_modules produksi + prisma/ (skema & migration). Tanpa src/, .env, test/, alat build.
#
# Konfigurasi & rahasia (DB_*, JWT_SECRET, BLOB_READ_WRITE_TOKEN, ...) dibaca saat RUNTIME dari environment,
# sehingga image yang sama dipakai di development, staging, dan production.
#
#   docker build -t tkbj-admin-api backend/admin-dashboard
#   docker run --rm --env-file .env tkbj-admin-api node dist/db/migrate.js   # migration (sekali per rilis)

ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS deps
# Prisma (query & schema engine) di Alpine membutuhkan OpenSSL.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
# postinstall menjalankan `prisma generate`, jadi skema harus sudah ada.
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build \
 && npm prune --omit=dev --no-audit --no-fund \
 && npx prisma generate

FROM ${NODE_IMAGE} AS runtime
RUN apk add --no-cache openssl
ENV NODE_ENV=production \
    PORT=5000 \
    # Di belakang Next.js/Nginx: percayai tepat 1 hop proxy (app.set('trust proxy', 1)) agar req.ip = IP pengguna.
    TRUST_PROXY=1 \
    UPLOADS_DIR=/app/uploads \
    MOBILE_UPLOADS_DIR=/data/mobile-uploads
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
# Folder unggahan dimiliki user `node` (volume Docker baru mewarisi pemilik ini).
RUN mkdir -p /app/uploads /data/mobile-uploads && chown -R node:node /app/uploads /data
# Tidak berjalan sebagai root.
USER node
EXPOSE 5000
# /health mengecek koneksi MySQL; dipakai Docker, Nginx, dan skrip deploy (zero-downtime).
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:5000/health || exit 1
# `node` langsung (bukan `npm start`) agar SIGTERM dari Docker sampai ke aplikasi → graceful shutdown (server.ts).
CMD ["node", "dist/server.js"]
