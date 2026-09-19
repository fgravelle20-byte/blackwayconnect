# Cloudflare secrets — blocker attach blackway.ca

## Diagnostic (19 sept. 2026)

- NS `blackway.ca` = Cloudflare (`quincy` / `lana`) ✅
- Records A/AAAA/CNAME apex = **vides** → `blackway.ca` ne résout pas ❌
- Workflow `Attach blackway.ca` échoue en ~0–9 s
- Cause racine : secret GitHub **`CLOUDFLARE_API_TOKEN` vide / manquant**
  (le script abort immédiatement ; wrangler deploy aussi)

## Fix propriétaire (2 min)

### Option A — secret (recommandé, unlock Actions)

1. Cloudflare Dash → My Profile → API Tokens → Create Token  
   Template **Edit zone DNS** + ajouter :
   - Zone → Page Rules → Edit
   - Account → Cloudflare Workers → Edit
   Zone Resources : `blackway.ca` (+ `blackwayconnect.com` pour deploy)
2. GitHub repo `fgravelle20-byte/blackwayconnect` → Settings → Secrets and variables → Actions
3. Set :
   - `CLOUDFLARE_API_TOKEN` = le token
   - `CLOUDFLARE_ACCOUNT_ID` = `eda7fc96b400297aaa0b185a26ad1846`
4. Actions → **Attach blackway.ca to blackway-site** → Run workflow
5. Lire le **Job Summary** (pas seulement les logs) : doit afficher `DONE — DNS CNAME + page-rule OK`
6. Puis Actions → **Deploy site** → Run workflow (Paddle checkout live sur `.com`)

### Option B — Dash manuel (si pas de secret)

1. DNS zone `blackway.ca` :
   - CNAME `@` → `blackwayconnect.com` (Proxied)
   - CNAME `www` → `blackwayconnect.com` (Proxied)
2. Rules → Page Rules (ou Redirect Rules) :
   - `*blackway.ca/*` → `https://blackwayconnect.com/$1` (301)
3. Workers → `blackway-site` → Custom Domains → add `blackway.ca` + `www.blackway.ca`

## Après fix

```bash
dig +short blackway.ca          # IPs Cloudflare
curl -sI https://blackway.ca    # 301 → blackwayconnect.com
curl -sI https://blackwayconnect.com/checkout  # 302 → vorixa.ca/pricing
```
