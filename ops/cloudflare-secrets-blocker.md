# Cloudflare secrets — blocker attach blackway.ca

## Diagnostic (19 sept. 2026 — post PR #28)

| Check | Résultat |
|-------|----------|
| NS `blackway.ca` | Cloudflare `quincy` / `lana` ✅ |
| Records A/AAAA/CNAME apex | **vides** → domaine ne résout pas ❌ |
| Secret `CLOUDFLARE_API_TOKEN` | **présent** (pas vide) |
| `GET /user/tokens/verify` | **échec** ❌ |
| `wrangler deploy` | **échec** (même token) ❌ |

Runs :
- Attach : https://github.com/fgravelle20-byte/blackwayconnect/actions/runs/35456045771  
  Annotation : `Cloudflare token verify failed`
- Deploy : https://github.com/fgravelle20-byte/blackwayconnect/actions/runs/35456045863  
  Build OK → `npx wrangler deploy` fail

**Cause :** le secret Actions existe mais le token est **invalide / expiré / mauvais compte**.

## Fix propriétaire (2 min) — OBLIGATOIRE

### Option A — régénérer le secret (recommandé)

1. Cloudflare Dash → My Profile → API Tokens → **Create Token**
   - Template **Edit zone DNS**
   - Permissions extras :
     - Zone → Page Rules → Edit
     - Account → Cloudflare Workers → Edit
   - Zone Resources : `Include` → `Specific zone` → `blackway.ca` **et** `blackwayconnect.com`
   - Account Resources : le compte qui possède `blackway-site` (`eda7fc96b400297aaa0b185a26ad1846`)
2. GitHub → `fgravelle20-byte/blackwayconnect` → Settings → Secrets and variables → Actions
3. **Update** (écraser) :
   - `CLOUDFLARE_API_TOKEN` = nouveau token
   - `CLOUDFLARE_ACCOUNT_ID` = `eda7fc96b400297aaa0b185a26ad1846`
4. Actions → **Attach blackway.ca to blackway-site** → Run workflow  
   Job Summary doit afficher : `DONE — DNS CNAME + page-rule OK`
5. Actions → **Deploy site** → Run workflow  
   (Paddle checkout `/checkout` → `vorixa.ca/pricing` déjà dans le code `main`)

### Option B — Dash manuel (si secret trop long à fixer)

1. DNS zone `blackway.ca` :
   - CNAME `@` → `blackwayconnect.com` (**Proxied**)
   - CNAME `www` → `blackwayconnect.com` (**Proxied**)
2. Rules → Page Rules (ou Redirect Rules) :
   - `*blackway.ca/*` → `https://blackwayconnect.com/$1` (**301**)
3. Workers → `blackway-site` → Custom Domains → add `blackway.ca` + `www.blackway.ca`
4. Workers → `blackway-site` → Deploy latest from `main` (si Builds Git connecté)  
   sinon Option A étape 5 une fois le token bon

## Après fix

```bash
dig +short blackway.ca                 # IPs Cloudflare
curl -sI https://blackway.ca           # 301 → blackwayconnect.com
curl -sI https://blackwayconnect.com/checkout  # 302 → vorixa.ca/pricing
```
