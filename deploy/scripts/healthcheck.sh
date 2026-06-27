#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.prod.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

APP_URL="${NEXT_PUBLIC_APP_URL:-http://127.0.0.1:${APP_PORT:-3000}}"

echo "Checking $APP_URL/api/health"
curl -fsS "$APP_URL/api/health"
echo

echo "Checking compose services"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
