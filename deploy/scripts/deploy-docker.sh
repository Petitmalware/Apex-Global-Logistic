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

RELEASE_ID="$(git rev-parse HEAD)"

compose() {
  APP_RELEASE="$RELEASE_ID" docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

check_health() {
  local health_url="$1"
  local label="$2"
  local response

  response="$(curl --fail --silent --show-error --max-time 20 "$health_url")"

  HEALTH_RESPONSE="$response" EXPECTED_RELEASE="$RELEASE_ID" node -e '
    const response = JSON.parse(process.env.HEALTH_RESPONSE ?? "");
    const expectedRelease = process.env.EXPECTED_RELEASE;

    if (response.status !== "ok" || response.checks?.database !== "ok") {
      throw new Error(`application health is ${response.status}; database is ${response.checks?.database}`);
    }

    if (response.release !== expectedRelease) {
      throw new Error(`expected release ${expectedRelease}, received ${response.release ?? "unknown"}`);
    }
  '

  echo "$label health check passed."
}

echo "Building application and migration images..."
compose build app migrate

echo "Starting data services..."
compose up -d postgres redis minio

echo "Running database migrations..."
compose run --rm migrate

echo "Starting application and object storage initialization..."
compose up -d app minio-init

APP_PORT="$(sed -n 's/^APP_PORT=//p' "$ENV_FILE" | tail -n 1 | tr -d '\r')"
APP_PORT="${APP_PORT:-3000}"
HEALTH_URL="http://127.0.0.1:${APP_PORT}/api/health"

echo "Waiting for application health at $HEALTH_URL..."
for attempt in {1..30}; do
  if check_health "$HEALTH_URL" "Local application"; then
    PUBLIC_APP_URL="$(sed -n 's/^NEXT_PUBLIC_APP_URL=//p' "$ENV_FILE" | tail -n 1 | tr -d '\r')"

    if [[ -z "$PUBLIC_APP_URL" ]]; then
      echo "NEXT_PUBLIC_APP_URL is required to verify the public reverse proxy." >&2
      exit 1
    fi

    PUBLIC_HEALTH_URL="${PUBLIC_APP_URL%/}/api/health"
    echo "Verifying the public reverse proxy at $PUBLIC_HEALTH_URL..."
    check_health "$PUBLIC_HEALTH_URL" "Public application"

    echo "Deployment complete."
    compose ps
    exit 0
  fi

  echo "Health check attempt $attempt/30 is not ready yet."
  sleep 5
done

echo "Application did not become healthy within 150 seconds." >&2
compose ps
compose logs --tail=200 app >&2
exit 1
