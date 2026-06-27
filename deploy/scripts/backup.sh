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

BACKUP_DIR="${BACKUP_DIR:-backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ABS_BACKUP_DIR="$ROOT_DIR/$BACKUP_DIR"

mkdir -p "$ABS_BACKUP_DIR"

POSTGRES_DUMP="$ABS_BACKUP_DIR/postgres-$TIMESTAMP.dump"
STORAGE_ARCHIVE="$ABS_BACKUP_DIR/storage-$TIMESTAMP.tar.gz"

echo "Creating PostgreSQL backup: $POSTGRES_DUMP"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump --format=custom --no-owner --no-acl \
  --username="${POSTGRES_USER:-apex}" \
  --dbname="${POSTGRES_DB:-apex_global_logistics}" \
  > "$POSTGRES_DUMP"

if [[ -d "$ROOT_DIR/storage" ]]; then
  echo "Creating local storage backup: $STORAGE_ARCHIVE"
  tar -czf "$STORAGE_ARCHIVE" -C "$ROOT_DIR" storage
else
  echo "No local storage directory found; skipping storage archive."
fi

echo "Removing backups older than $BACKUP_RETENTION_DAYS days."
find "$ABS_BACKUP_DIR" -type f -name "postgres-*.dump" -mtime +"$BACKUP_RETENTION_DAYS" -delete
find "$ABS_BACKUP_DIR" -type f -name "storage-*.tar.gz" -mtime +"$BACKUP_RETENTION_DAYS" -delete

echo "Backup complete."
