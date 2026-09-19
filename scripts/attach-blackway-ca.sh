#!/usr/bin/env bash
# Point blackway.ca → blackwayconnect.com (DNS + redirect + best-effort Workers bind).
# Writes diagnostics to GITHUB_STEP_SUMMARY so failures are visible without Azure log fetch.
set -uo pipefail

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-eda7fc96b400297aaa0b185a26ad1846}"
TOKEN="${CLOUDFLARE_API_TOKEN:-}"
API="https://api.cloudflare.com/client/v4"
SUMMARY="${GITHUB_STEP_SUMMARY:-/dev/stdout}"
FAIL=0

sum() { echo "$*" >> "$SUMMARY"; }
section() { echo >> "$SUMMARY"; echo "### $*" >> "$SUMMARY"; echo '```' >> "$SUMMARY"; }
endsec() { echo '```' >> "$SUMMARY"; }

{
  echo "## blackway.ca attach"
  if [[ -n "$TOKEN" ]]; then
    echo "- token: set (len=${#TOKEN})"
  else
    echo "- token: **EMPTY**"
  fi
  echo "- account env: ${ACCOUNT_ID:-empty}"
  echo "- started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
} >> "$SUMMARY"

if [[ -z "$TOKEN" ]]; then
  echo "::error::CLOUDFLARE_API_TOKEN secret is empty or missing"
  sum "**FATAL: CLOUDFLARE_API_TOKEN empty**"
  sum "Repo → Settings → Secrets and variables → Actions → set \`CLOUDFLARE_API_TOKEN\` (Zone:DNS:Edit + Zone:Page Rules:Edit + Account:Cloudflare Workers:Edit) and \`CLOUDFLARE_ACCOUNT_ID\`."
  sum "Or in Cloudflare Dash: Workers → blackway-site → Domains → add blackway.ca + www; DNS zone blackway.ca → CNAME apex+www → blackwayconnect.com (proxied) + Redirect *blackway.ca/* → https://blackwayconnect.com/\$1."
  exit 1
fi

auth=(-H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json")

echo "== verify token =="
VERIFY=$(curl -sS --max-time 30 "${auth[@]}" "${API}/user/tokens/verify" || echo '{"success":false,"errors":[{"message":"curl failed"}]}')
section "token verify"
echo "$VERIFY" | python3 -m json.tool 2>/dev/null | tee -a "$SUMMARY" || echo "$VERIFY" | tee -a "$SUMMARY"
endsec
VERIFY_OK=$(echo "$VERIFY" | python3 -c "import json,sys; print(json.load(sys.stdin).get('success'))" 2>/dev/null || echo false)
if [[ "$VERIFY_OK" != "True" && "$VERIFY_OK" != "true" ]]; then
  ERR_MSG=$(echo "$VERIFY" | python3 -c "import json,sys; d=json.load(sys.stdin); errs=d.get('errors') or []; print(errs[0].get('message') if errs else d)" 2>/dev/null || echo "$VERIFY")
  echo "::error::Cloudflare token verify failed — ${ERR_MSG}"
  sum "**FATAL: token verify failed**"
  sum "Le secret existe mais le token est invalide/expiré. Régénérer \`CLOUDFLARE_API_TOKEN\` (voir ops/cloudflare-secrets-blocker.md)."
  sum "verify error: ${ERR_MSG}"
  exit 1
fi

echo "== list zones =="
ZONES=$(curl -sS --max-time 30 "${auth[@]}" "${API}/zones?per_page=50" || echo '{"success":false,"result":[]}')
python3 -c '
import json,sys
d=json.load(sys.stdin)
print("success", d.get("success"), "errors", d.get("errors"))
for z in d.get("result") or []:
    acct=(z.get("account") or {}).get("id","")
    print("%s %s %s acct=%s" % (z.get("name"), z.get("id"), z.get("status"), acct))
' <<<"$ZONES" | tee /tmp/cf-zones.txt
section "zones"
cat /tmp/cf-zones.txt >> "$SUMMARY"
endsec

ZONE_ID=$(python3 -c '
import json,sys
d=json.load(sys.stdin)
zs=[z for z in (d.get("result") or []) if z.get("name")=="blackway.ca"]
print(zs[0]["id"] if zs else "")
' <<<"$ZONES")
ACCOUNT_FROM_ZONE=$(python3 -c '
import json,sys
d=json.load(sys.stdin)
zs=[z for z in (d.get("result") or []) if z.get("name")=="blackway.ca"]
print((zs[0].get("account") or {}).get("id","") if zs else "")
' <<<"$ZONES")
ACCOUNT_ID="${ACCOUNT_ID:-$ACCOUNT_FROM_ZONE}"

if [[ -z "$ZONE_ID" ]]; then
  echo "::error::zone blackway.ca not found under this API token"
  sum "**FATAL: blackway.ca zone not found**"
  sum "NS are already Cloudflare (quincy/lana). Add the zone to this account or grant the token Zone:Read + Zone:DNS:Edit on blackway.ca."
  exit 1
fi

sum "ZONE_ID=$ZONE_ID ACCOUNT_ID=$ACCOUNT_ID"

# Drop conflicting apex A/AAAA so CNAME flatten can land.
echo "== clear conflicting A/AAAA on apex/www =="
for name in blackway.ca www.blackway.ca; do
  for typ in A AAAA; do
    LIST=$(curl -sS --max-time 30 "${auth[@]}" "${API}/zones/${ZONE_ID}/dns_records?type=${typ}&name=${name}")
    echo "$LIST" | python3 -c '
import json,sys,os
d=json.load(sys.stdin)
for r in d.get("result") or []:
    print(r["id"])
' > /tmp/cf-del-ids.txt
    while read -r rid; do
      [[ -z "$rid" ]] && continue
      DEL=$(curl -sS --max-time 30 "${auth[@]}" -X DELETE "${API}/zones/${ZONE_ID}/dns_records/${rid}")
      echo "delete $typ $name $rid => $(echo "$DEL" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success'), d.get('errors'))")"
    done < /tmp/cf-del-ids.txt
  done
done

upsert_cname() {
  local name="$1"
  local content="blackwayconnect.com"
  local existing rid body RESP
  existing=$(curl -sS --max-time 30 "${auth[@]}" "${API}/zones/${ZONE_ID}/dns_records?type=CNAME&name=${name}")
  rid=$(echo "$existing" | python3 -c "import json,sys; d=json.load(sys.stdin); r=d.get('result') or []; print(r[0]['id'] if r else '')")
  body=$(NAME="$name" CONTENT="$content" python3 -c 'import json,os; print(json.dumps({"type":"CNAME","name":os.environ["NAME"],"content":os.environ["CONTENT"],"ttl":1,"proxied":True}))')
  if [[ -n "$rid" ]]; then
    RESP=$(curl -sS --max-time 30 "${auth[@]}" -X PUT "${API}/zones/${ZONE_ID}/dns_records/${rid}" --data "$body")
  else
    RESP=$(curl -sS --max-time 30 "${auth[@]}" -X POST "${API}/zones/${ZONE_ID}/dns_records" --data "$body")
  fi
  local line
  line="CNAME $name => $(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success'), d.get('errors'))")"
  echo "$line" | tee -a "$SUMMARY"
  echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); raise SystemExit(0 if d.get('success') else 1)" || FAIL=1
}

echo "== upsert CNAME flatten → blackwayconnect.com =="
upsert_cname "blackway.ca"
upsert_cname "www.blackway.ca"

echo "== ensure page rule redirect =="
# Idempotent: delete matching forward rules then recreate one.
EXISTING_RULES=$(curl -sS --max-time 30 "${auth[@]}" "${API}/zones/${ZONE_ID}/pagerules" || echo '{"result":[]}')
echo "$EXISTING_RULES" | python3 -c '
import json,sys
d=json.load(sys.stdin)
for r in d.get("result") or []:
    targets=r.get("targets") or []
    blob=json.dumps(targets)
    if "blackway.ca" in blob:
        print(r["id"])
' > /tmp/cf-pr-ids.txt
while read -r prid; do
  [[ -z "$prid" ]] && continue
  DEL=$(curl -sS --max-time 30 "${auth[@]}" -X DELETE "${API}/zones/${ZONE_ID}/pagerules/${prid}")
  echo "delete pagerule $prid => $(echo "$DEL" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success'), d.get('errors'))")"
done < /tmp/cf-pr-ids.txt

PR_BODY='{"targets":[{"target":"url","constraint":{"operator":"matches","value":"*blackway.ca/*"}}],"actions":[{"id":"forwarding_url","value":{"url":"https://blackwayconnect.com/$1","status_code":301}}],"priority":1,"status":"active"}'
PR_RESP=$(curl -sS --max-time 30 "${auth[@]}" -X POST "${API}/zones/${ZONE_ID}/pagerules" --data "$PR_BODY")
echo "pagerule => $(echo "$PR_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success'), d.get('errors') or d.get('result',{}).get('id'))")" | tee -a "$SUMMARY"
echo "$PR_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); raise SystemExit(0 if d.get('success') else 1)" || FAIL=1

if [[ -n "$ACCOUNT_ID" ]]; then
  echo "== Workers custom domain bind (best-effort) =="
  for host in blackway.ca www.blackway.ca; do
    WRESP=$(curl -sS --max-time 30 "${auth[@]}" -X PUT "${API}/accounts/${ACCOUNT_ID}/workers/domains" --data "{\"hostname\":\"${host}\",\"service\":\"blackway-site\",\"environment\":\"production\"}")
    echo "workers domain $host => $(echo "$WRESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success'), d.get('errors'))")" | tee -a "$SUMMARY"
  done
fi

sum ""
if [[ "$FAIL" -eq 0 ]]; then
  sum "**DONE — DNS CNAME + page-rule OK.** Wait ~1–5 min then \`dig blackway.ca\` should return Cloudflare IPs and HTTPS should 301 to blackwayconnect.com."
  echo DONE
  exit 0
fi

sum "**PARTIAL FAILURE** — see CNAME/pagerule lines above."
exit 1

# re-run attach after CLOUDFLARE_API_TOKEN update (2026-09-19T20:21:25Z)

# token check 2026-09-19T20:26:00Z
