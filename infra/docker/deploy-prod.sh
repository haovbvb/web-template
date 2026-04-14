#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.prod.yml"
STATE_DIR="$ROOT_DIR/infra/docker/.deploy-state"
mkdir -p "$STATE_DIR"

IMAGE_TAG="${1:-latest}"
REGISTRY_PREFIX="${REGISTRY_PREFIX:-ghcr.io/example}"

export API_IMAGE="${REGISTRY_PREFIX}/enterprise-api:${IMAGE_TAG}"
export WEB_IMAGE="${REGISTRY_PREFIX}/enterprise-web:${IMAGE_TAG}"

printf '%s\n' "$IMAGE_TAG" > "$STATE_DIR/last_tag.txt"

echo "Deploying tag: $IMAGE_TAG"
docker compose -f "$COMPOSE_FILE" pull web api
docker compose -f "$COMPOSE_FILE" up -d web api

echo "Deployment completed with tag: $IMAGE_TAG"