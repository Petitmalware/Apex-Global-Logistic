#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.prod.yml"

cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing production environment file: $ENV_FILE" >&2
  echo "Copy deploy/env.production.example to .env.production and fill in secrets." >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/backups" "$ROOT_DIR/logs" "$ROOT_DIR/storage"

echo "Building application and migration images..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build app migrate

echo "Starting data services..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres redis minio

echo "Running database migrations..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm migrate

echo "Starting application and object storage initialization..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d app minio-init

APP_PORT="$(sed -n 's/^APP_PORT=//p' "$ENV_FILE" | tail -n 1 | tr -d '\r')"
APP_PORT="${APP_PORT:-3000}"
HEALTH_URL="http://127.0.0.1:${APP_PORT}/api/health"

echo "Waiting for application health at $HEALTH_URL..."
for attempt in {1..30}; do
  if curl --fail --silent --show-error --max-time 10 "$HEALTH_URL" >/dev/null; then
    echo "Application is healthy."
    echo "Deployment complete."
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
    exit 0
  fi

  echo "Health check attempt $attempt/30 is not ready yet."
  sleep 5
done

echo "Application did not become healthy within 150 seconds." >&2
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=200 app >&2
exit 1
