# syntax=docker/dockerfile:1
#
# Image produksi panel admin (Next.js App Router), multi-stage build:
#   deps    → npm ci
#   build   → next build dengan output: 'standalone' (next.config.mjs)
#   runtime → hanya .next/standalone (server.js + node_modules minimum hasil tracing) + .next/static + public.
#             Tanpa source code, devDependencies, .env.local, dan test.
#
# PENTING (build vs runtime): variabel NEXT_PUBLIC_* dikunci permanen saat `next build`. Image ini sengaja TIDAK
# memakai NEXT_PUBLIC_* sama sekali; alamat backend dibaca dari API_URL saat container berjalan, sehingga image
# yang sama bisa dipakai di development, staging, dan production:
#
#   docker build -t tkbj-dashboard frontend/admin-dashboard
#   docker run -p 3000:3000 -e API_URL=http://admin-api:5000/api tkbj-dashboard

ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS deps
# Disarankan Next.js untuk image Alpine (modul native seperti sharp untuk optimasi <Image/>).
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
# /api/health = Next.js hidup + API dashboard (dan MySQL di belakangnya) sehat.
HEALTHCHECK --interval=10s --timeout=4s --start-period=20s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
