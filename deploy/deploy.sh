#!/usr/bin/env bash
#
# Rilis tanpa downtime (dijalankan di server, dari folder deploy/; dipanggil otomatis oleh GitHub Actions):
#
#   bash deploy.sh <IMAGE_TAG>        # mis. commit SHA dari CI; bawaan: latest
#
# Alur per layanan (admin-api → mobile-api → dashboard):
#   1. jalankan container VERSI BARU di samping versi lama (docker compose --scale <svc>=2);
#   2. tunggu sampai health check versi baru "healthy" (GET /health → app hidup + koneksi MySQL sehat);
#   3a. sehat  → reload Nginx (trafik dibagi ke versi baru), lalu hentikan versi lama dengan SIGTERM
#               → graceful shutdown: permintaan yang sedang berjalan diselesaikan dulu (server.ts);
#   3b. gagal  → hapus container baru, versi lama TETAP melayani (rollback aman), skrip berhenti dengan error.
# Migration dijalankan lebih dulu dan harus mengikuti pola expand-contract (lihat README.md) karena versi lama
# dan baru sempat berjalan bersamaan.

set -euo pipefail
cd "$(dirname "$0")"

export IMAGE_TAG="${1:-${IMAGE_TAG:-latest}}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"
SERVICES=(admin-api mobile-api dashboard)
compose() { docker compose "$@"; }
log() { printf '[deploy %s] %s\n' "$(date +%H:%M:%S)" "$*"; }

# Tunggu status health check sebuah container: 0 = healthy, 1 = unhealthy/hilang/timeout.
wait_healthy() {
  local id=$1 deadline=$((SECONDS + HEALTH_TIMEOUT)) status
  while ((SECONDS < deadline)); do
    status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$id" 2>/dev/null || echo missing)
    case $status in
      healthy) return 0 ;;
      unhealthy | missing | none) return 1 ;;
    esac
    sleep 2
  done
  return 1
}

reload_nginx() {
  if [[ -n "$(compose ps -q nginx)" ]]; then
    compose exec -T nginx nginx -s reload >/dev/null
  fi
}

rollout() {
  local svc=$1 old new
  old=$(compose ps -q "$svc")

  if [[ -z "$old" ]]; then
    log "$svc: belum berjalan → start pertama kali"
    compose up -d --no-deps "$svc"
    wait_healthy "$(compose ps -q "$svc")" || { log "$svc: TIDAK sehat"; return 1; }
    return 0
  fi

  log "$svc: menjalankan versi $IMAGE_TAG di samping versi lama"
  compose up -d --no-deps --no-recreate --scale "$svc=2" "$svc"
  new=$(comm -13 <(sort <<<"$old") <(compose ps -q "$svc" | sort))
  if [[ -z "$new" ]]; then
    log "$svc: container baru tidak terbentuk"
    return 1
  fi

  if ! wait_healthy "$new"; then
    log "$svc: versi baru TIDAK sehat dalam ${HEALTH_TIMEOUT} dtk → ROLLBACK, versi lama tetap melayani. Log terakhir:"
    docker logs --tail 40 "$new" || true
    docker rm -f "$new" >/dev/null
    reload_nginx
    return 1
  fi

  log "$svc: versi baru sehat → alihkan trafik, hentikan versi lama dengan rapi (SIGTERM)"
  reload_nginx
  docker stop --time 30 "$old" >/dev/null
  docker rm "$old" >/dev/null
  reload_nginx
  log "$svc: selesai"
}

log "Rilis versi image: $IMAGE_TAG"
compose pull "${SERVICES[@]}" migrate

log "Migration database (expand, kompatibel dengan versi lama)"
compose run --rm migrate

for svc in "${SERVICES[@]}"; do
  rollout "$svc" || { log "Rilis DIBATALKAN di $svc. Layanan yang sudah diperbarui tetap kompatibel (expand-contract)."; exit 1; }
done

compose up -d --no-deps nginx
docker image prune -f >/dev/null || true
log "Rilis $IMAGE_TAG selesai tanpa downtime."
