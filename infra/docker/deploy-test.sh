#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[deprecated] use ./infra/docker/deploy-prod.sh <tag> instead"
exec "$SCRIPT_DIR/deploy-prod.sh" "$@"
