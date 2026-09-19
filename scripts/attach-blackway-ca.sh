#!/usr/bin/env bash
# Attach blackway.ca + www to Worker blackway-site (Cloudflare API).
# Requires: CLOUDFLARE_API_TOKEN with Workers + Zone DNS edit
# Account (from existing ops scripts): eda7fc96b400297aaa0b185a26ad1846
set -euo pipefail

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-eda7fc96b400297aaa0b185a26ad1846}"
TOKEN="${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN}"
WORKER="${WORKER_NAME:-blackway-site}"
API="https://api.cloudflare.com/client/v4"

auth=(-H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json")

echo "== zone blackway.ca =="
ZONE_JSON=$(curl -sS "${auth[@]}" "${API}/zones?name=blackway.ca")
ZONE_ID=$(python3 -c "import json,sys; d=json.load(sys.stdin); r=d.get('result') or []; print(r[0]['id'] if r else '')" <<<"$ZONE_JSON")
if [[ -z "$ZONE_ID" ]]; then
  echo "Zone blackway.ca not found in this account. Output:" >&2
  echo "$ZONE_JSON" >&2
  exit 1
fi
echo "ZONE_ID=$ZONE_ID"

attach() {
  local hostname="$1"
  echo "== attach ${hostname} → ${WORKER} =="
  curl -sS "${auth[@]}" -X PUT \
    "${API}/accounts/${ACCOUNT_ID}/workers/domains" \
    --data "{\"hostname\":\"${hostname}\",\"service\":\"${WORKER}\",\"environment\":\"production\"}" \
    | python3 -m json.tool
}

attach "blackway.ca"
attach "www.blackway.ca"

echo "== DNS check =="
dig +short A blackway.ca || true
dig +short A www.blackway.ca || true
echo "Done. Expect Cloudflare anycast A records within ~1–2 min."
