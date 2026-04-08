#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[STEP] lint"
pnpm lint

echo "[STEP] api coverage"
pnpm --filter @apps/api test:coverage

echo "[STEP] build api/web/worker"
pnpm --filter @apps/api build
pnpm --filter @apps/web build
pnpm --filter @apps/admin-worker build

echo "[PASS] Local quality gates completed."
