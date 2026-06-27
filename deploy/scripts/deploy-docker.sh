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

echo "Deployment complete."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
