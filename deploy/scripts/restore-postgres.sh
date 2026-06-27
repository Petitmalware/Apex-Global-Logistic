#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: CONFIRM_RESTORE=yes deploy/scripts/restore-postgres.sh backups/postgres-YYYYMMDDTHHMMSSZ.dump" >&2
  exit 1
fi

if [[ "${CONFIRM_RESTORE:-}" != "yes" ]]; then
  echo "Refusing to restore without CONFIRM_RESTORE=yes." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.prod.yml"
DUMP_FILE="$1"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$DUMP_FILE" ]]; then
  echo "Dump file not found: $DUMP_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

echo "Restoring PostgreSQL from $DUMP_FILE"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  pg_restore --clean --if-exists --no-owner --no-acl \
  --username="${POSTGRES_USER:-apex}" \
  --dbname="${POSTGRES_DB:-apex_global_logistics}" \
  < "$DUMP_FILE"

echo "Restore complete."
