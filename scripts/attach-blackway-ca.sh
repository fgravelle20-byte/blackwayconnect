#!/usr/bin/env bash
# Point blackway.ca → blackwayconnect.com via Cloudflare zone redirect + DNS.
# Requires: CLOUDFLARE_API_TOKEN (Zone DNS Edit + Zone Rules / Page Rules)
set -euo pipefail

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-eda7fc96b400297aaa0b185a26ad1846}"
TOKEN="${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN}"
API="https://api.cloudflare.com/client/v4"
auth=(-H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json")

echo "== token probe (verify membership) =="
curl -sS "${auth[@]}" "${API}/user/tokens/verify" | python3 -m json.tool || true

echo "== list zones matching blackway =="
ZONES=$(curl -sS "${auth[@]}" "${API}/zones?per_page=50")
echo "$ZONES" | python3 -c "import json,sys; d=json.load(sys.stdin); print('success', d.get('success'));
[print(z['name'], z['id'], z['status']) for z in (d.get('result') or []) if 'blackway' in z.get('name','')]"

ZONE_ID=$(echo "$ZONES" | python3 -c "import json,sys; d=json.load(sys.stdin); 
zs=[z for z in (d.get('result') or []) if z.get('name')=='blackway.ca'];
print(zs[0]['id'] if zs else '')")
if [[ -z "$ZONE_ID" ]]; then
  echo "FATAL: zone blackway.ca not in this Cloudflare account" >&2
  echo "$ZONES" | python3 -m json.tool | head -80 >&2
  exit 1
fi
echo "ZONE_ID=$ZONE_ID"

echo "== ensure proxied DNS (CNAME flatten apex + www → blackwayconnect.com) =="
upsert_cname() {
  local name="$1"
  local content="blackwayconnect.com"
  local existing
  existing=$(curl -sS "${auth[@]}" "${API}/zones/${ZONE_ID}/dns_records?type=CNAME&name=${name}")
  local rid
  rid=$(echo "$existing" | python3 -c "import json,sys; d=json.load(sys.stdin); r=d.get('result') or []; print(r[0]['id'] if r else '')")
  local body
  body=$(python3 -c "import json; print(json.dumps({'type':'CNAME','name':'''${name}''','content':'''${content}''','ttl':1,'proxied':True}))")
  if [[ -n "$rid" ]]; then
    echo "update CNAME $name ($rid)"
    curl -sS "${auth[@]}" -X PUT "${API}/zones/${ZONE_ID}/dns_records/${rid}" --data "$body" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success'), d.get('errors'))"
  else
    echo "create CNAME $name"
    curl -sS "${auth[@]}" -X POST "${API}/zones/${ZONE_ID}/dns_records" --data "$body" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success'), d.get('errors'))"
  fi
}
upsert_cname "blackway.ca"
upsert_cname "www.blackway.ca"

echo "== page rule: *blackway.ca/* → https://blackwayconnect.com/\$1 =="
# Remove existing forward rules for blackway.ca to avoid duplicates
EXISTING_RULES=$(curl -sS "${auth[@]}" "${API}/zones/${ZONE_ID}/pagerules")
echo "$EXISTING_RULES" | python3 -c "import json,sys; d=json.load(sys.stdin); print('pagerules success', d.get('success'), 'count', len(d.get('result') or []))"

# Create forwarding page rule
PR_BODY='{
  "targets": [{"target":"url","constraint":{"operator":"matches","value":"*blackway.ca/*"}}],
  "actions": [{"id":"forwarding_url","value":{"url":"https://blackwayconnect.com/$1","status_code":301}}],
  "priority": 1,
  "status": "active"
}'
curl -sS "${auth[@]}" -X POST "${API}/zones/${ZONE_ID}/pagerules" --data "$PR_BODY" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('pagerule success', d.get('success')); print(d.get('errors') or d.get('result',{}).get('id'))"

echo "== try Workers custom domain bind (best-effort) =="
for host in blackway.ca www.blackway.ca; do
  curl -sS "${auth[@]}" -X PUT \
    "${API}/accounts/${ACCOUNT_ID}/workers/domains" \
    --data "{\"hostname\":\"${host}\",\"service\":\"blackway-site\",\"environment\":\"production\"}" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print('${host}', d.get('success'), d.get('errors'))"
done

echo "== dig =="
dig +short A blackway.ca || true
dig +short CNAME blackway.ca || true
dig +short A www.blackway.ca || true
echo DONE
