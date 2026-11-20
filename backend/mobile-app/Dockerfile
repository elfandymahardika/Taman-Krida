# syntax=docker/dockerfile:1
#
# Image produksi API aplikasi mobile (Express + TypeScript), multi-stage build:
#   deps    → npm ci (termasuk devDependencies untuk kompilasi TypeScript)
#   build   → tsc ke dist/, lalu buang devDependencies
#   runtime → hanya dist/ + node_modules produksi + prisma/schema.prisma. Tanpa src/, .env, test/, alat build.
#
# Migration database dijalankan oleh image API dashboard (backend/admin-dashboard), karena skema dimiliki di sana.
# Rahasia (DB_*, JWT_SECRET, GEMINI_API_KEY, BLOB_READ_WRITE_TOKEN) dibaca saat RUNTIME dari environment.
#
#   docker build -t tkbj-mobile-api backend/mobile-app

ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
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
    PORT=5001 \
    # Di belakang Nginx: percayai tepat 1 hop proxy agar req.ip (rate limiter & log) = IP pengguna aplikasi.
    TRUST_PROXY=1 \
    UPLOADS_DIR=/app/uploads
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 5001
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:5001/health || exit 1
CMD ["node", "dist/server.js"]
