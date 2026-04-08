#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DEV_COMPOSE="$ROOT_DIR/infra/docker/docker-compose.dev.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "[FAIL] docker command not found."
  echo "Install Docker Desktop first, then re-run this script."
  exit 1
fi

echo "[STEP] Validate compose file"
docker compose -f "$DEV_COMPOSE" config >/dev/null

echo "[STEP] Start core stack (api/web/worker + infra)"
docker compose -f "$DEV_COMPOSE" up -d --build api web admin-worker redis postgres mongo

echo "[STEP] Wait and inspect service states"
sleep 10
docker compose -f "$DEV_COMPOSE" ps

echo "[STEP] Probe API docs and metrics"
node <<'NODE'
const checks = [
  'http://localhost:3000/api-docs',
  'http://localhost:3000/metrics',
  'http://localhost:5173',
];
(async () => {
  for (const url of checks) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed: ${url} => ${response.status}`);
    }
    console.log(`[OK] ${url} => ${response.status}`);
  }
})().catch((error) => {
  console.error(`[FAIL] ${error.message}`);
  process.exit(1);
});
NODE

echo "[PASS] Docker smoke check completed."

echo "[INFO] To stop stack:"
echo "docker compose -f infra/docker/docker-compose.dev.yml down"
