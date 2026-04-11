#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.prod.yml"
STATE_DIR="$ROOT_DIR/infra/docker/.deploy-state"

if [ ! -f "$STATE_DIR/last_tag.txt" ]; then
  echo "No previous deployment tag found."
  exit 1
fi

CURRENT_TAG="$(cat "$STATE_DIR/last_tag.txt")"
PREVIOUS_TAG="${1:-previous}"

if [ "$PREVIOUS_TAG" = "previous" ]; then
  echo "Please provide explicit rollback tag: ./rollback-test.sh <tag>"
  echo "Current deployed tag: $CURRENT_TAG"
  exit 1
fi

REGISTRY_PREFIX="${REGISTRY_PREFIX:-ghcr.io/example}"
export API_IMAGE="${REGISTRY_PREFIX}/enterprise-api:${PREVIOUS_TAG}"
export WEB_IMAGE="${REGISTRY_PREFIX}/enterprise-web:${PREVIOUS_TAG}"

printf '%s\n' "$PREVIOUS_TAG" > "$STATE_DIR/last_tag.txt"

echo "Rolling back to tag: $PREVIOUS_TAG"
docker compose -f "$COMPOSE_FILE" pull web api
docker compose -f "$COMPOSE_FILE" up -d web api

echo "Rollback completed."
