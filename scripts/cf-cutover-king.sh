#!/usr/bin/env bash
# Deploy BlackWay CF proxy → Railway + attach original domains.
# Requires: export CLOUDFLARE_API_TOKEN=...
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "ERROR: set CLOUDFLARE_API_TOKEN first"
  echo "Create at: https://dash.cloudflare.com/profile/api-tokens"
  echo "Permissions: Workers Scripts Edit + Workers Routes Edit + Zone DNS Edit (blackwayconnect.com)"
  exit 1
fi

echo "==> Deploy Worker proxy (src/index.js → Railway)"
npx --yes wrangler@4 deploy

echo "==> Verify workers.dev health"
curl -sS "https://blackwayconnect.f-gravelle20.workers.dev/health" || true
echo
curl -sSI "https://blackwayconnect.f-gravelle20.workers.dev/" | grep -iE 'x-bw-proxy|HTTP/' || true

echo
echo "==> Verify public domains"
for h in www.blackwayconnect.com blackwayconnect.com; do
  echo "--- $h"
  curl -sSI --max-time 20 "https://$h/health" | grep -iE 'x-bw-proxy|HTTP/|cf-ray' || true
done

echo
echo "OK if browser URL stays www.blackwayconnect.com and health shows Railway."
