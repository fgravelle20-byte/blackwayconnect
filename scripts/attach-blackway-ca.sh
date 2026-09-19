#!/usr/bin/env bash
set -uo pipefail
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
TOKEN="${CLOUDFLARE_API_TOKEN:-}"
API="https://api.cloudflare.com/client/v4"
SUMMARY="${GITHUB_STEP_SUMMARY:-/dev/stdout}"

{
  echo "## blackway.ca attach"
  echo "- token set: $([[ -n \"$TOKEN\" ]] && echo yes || echo NO)"
  echo "- account env: ${ACCOUNT_ID:-empty}"
} >> "$SUMMARY"

if [[ -z "$TOKEN" ]]; then
  echo "::error::CLOUDFLARE_API_TOKEN secret is empty"
  echo "**FATAL: CLOUDFLARE_API_TOKEN empty**" >> "$SUMMARY"
  exit 1
fi

auth=(-H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json")

echo "== verify token =="
VERIFY=$(curl -sS "${auth[@]}" "${API}/user/tokens/verify" || true)
echo "$VERIFY" | tee /tmp/cf-verify.json | head -c 500
echo "$VERIFY" >> "$SUMMARY"
echo >> "$SUMMARY"

echo "== list ALL zones (first 50) =="
ZONES=$(curl -sS "${auth[@]}" "${API}/zones?per_page=50" || true)
echo "$ZONES" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('success', d.get('success'), 'errors', d.get('errors'))
for z in d.get('result') or []:
    print(z.get('name'), z.get('id'), z.get('status'), z.get('account',{}).get('id'))
" | tee /tmp/cf-zones.txt
cat /tmp/cf-zones.txt >> "$SUMMARY"

ZONE_ID=$(python3 -c "
import json
d=json.load(open('/tmp/cf-zones.txt').read() and open('/dev/stdin') if False else open('/tmp/cf-verify.json'))
" 2>/dev/null || true)

ZONE_ID=$(echo "$ZONES" | python3 -c "
import json,sys
d=json.load(sys.stdin)
zs=[z for z in (d.get('result') or []) if z.get('name')=='blackway.ca']
print(zs[0]['id'] if zs else '')
print('ACCOUNT', zs[0].get('account',{}).get('id') if zs else '', file=sys.stderr)
")

if [[ -z "$ZONE_ID" ]]; then
  echo "::error::zone blackway.ca not found under this API token"
  echo "**FATAL: blackway.ca zone not found**" >> "$SUMMARY"
  # Still exit 0? No - fail so we see it, but dump helpful next steps
  echo "Next: add zone blackway.ca to CF account or fix token permissions (Zone:Read)" >> "$SUMMARY"
  exit 1
fi

echo "ZONE_ID=$ZONE_ID" | tee -a "$SUMMARY"
ACCOUNT_FROM_ZONE=$(echo "$ZONES" | python3 -c "import json,sys; d=json.load(sys.stdin); zs=[z for z in d.get('result') or [] if z.get('name')=='blackway.ca']; print(zs[0].get('account',{}).get('id',''))")
ACCOUNT_ID="${ACCOUNT_ID:-$ACCOUNT_FROM_ZONE}"
echo "ACCOUNT_ID=$ACCOUNT_ID" | tee -a "$SUMMARY"

upsert_cname() {
  local name="$1"
  local content="blackwayconnect.com"
  local existing rid body
  existing=$(curl -sS "${auth[@]}" "${API}/zones/${ZONE_ID}/dns_records?type=CNAME&name=${name}")
  rid=$(echo "$existing" | python3 -c "import json,sys; d=json.load(sys.stdin); r=d.get('result') or []; print(r[0]['id'] if r else '')")
  body=$(NAME="$name" CONTENT="$content" python3 -c 'import json,os; print(json.dumps({"type":"CNAME","name":os.environ["NAME"],"content":os.environ["CONTENT"],"ttl":1,"proxied":True}))')
  if [[ -n "$rid" ]]; then
    RESP=$(curl -sS "${auth[@]}" -X PUT "${API}/zones/${ZONE_ID}/dns_records/${rid}" --data "$body")
  else
    RESP=$(curl -sS "${auth[@]}" -X POST "${API}/zones/${ZONE_ID}/dns_records" --data "$body")
  fi
  echo "CNAME $name => $(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success'), d.get('errors'))")" | tee -a "$SUMMARY"
}

upsert_cname "blackway.ca"
upsert_cname "www.blackway.ca"

PR_BODY='{"targets":[{"target":"url","constraint":{"operator":"matches","value":"*blackway.ca/*"}}],"actions":[{"id":"forwarding_url","value":{"url":"https://blackwayconnect.com/$1","status_code":301}}],"priority":1,"status":"active"}'
PR_RESP=$(curl -sS "${auth[@]}" -X POST "${API}/zones/${ZONE_ID}/pagerules" --data "$PR_BODY")
echo "pagerule => $(echo "$PR_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success'), d.get('errors') or d.get('result',{}).get('id'))")" | tee -a "$SUMMARY"

for host in blackway.ca www.blackway.ca; do
  WRESP=$(curl -sS "${auth[@]}" -X PUT "${API}/accounts/${ACCOUNT_ID}/workers/domains" --data "{\"hostname\":\"${host}\",\"service\":\"blackway-site\",\"environment\":\"production\"}")
  echo "workers domain $host => $(echo "$WRESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success'), d.get('errors'))")" | tee -a "$SUMMARY"
done

echo DONE | tee -a "$SUMMARY"
