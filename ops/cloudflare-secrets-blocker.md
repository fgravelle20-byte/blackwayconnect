# Cloudflare secrets — GitHub + Workers Builds

## Deploy officiel

**Cloudflare Workers Builds** publie `blackway-site`, `blackway-pipe`, `blackway-sentinel`.  
Les workflows GitHub Actions `Deploy site` / `Deploy pipe` **vérifient** seulement (plus de `wrangler deploy` sur push).

## Secrets — blackway-site

| Secret / var | Où | Valeur |
|--------------|-----|--------|
| `VITE_PADDLE_CLIENT_TOKEN` | **Workers Builds** (obligatoire) · GitHub (optionnel) | `live_…` |
| `CLOUDFLARE_API_TOKEN` | optionnel (Dash only) | Zone/Workers si outils manuels |
| `CLOUDFLARE_ACCOUNT_ID` | `eda7fc96b400297aaa0b185a26ad1846` | |

Sans token dans **Workers Builds** → `/payer` indisponible en prod.  
Sans secret GitHub → warning CI seulement (CF Builds = source de vérité).

## Secrets — blackway-pipe (Workers Dash secrets)

| Secret | Rôle |
|--------|------|
| `PADDLE_API_KEY` | claim / customer email |
| `PADDLE_WEBHOOK_SECRET` | `/webhooks/paddle` |
| `HUBSPOT_TOKEN` | CRM |
| `BW_LEAD_KEY` | `/lead` + ops |
| `BW_PORTAL_SECRET` | JWT portail |

Health : `GET https://api.blackwayconnect.com/health` → `paddle_ready: true`.

## Note

- Vérifier jetons compte via `GET /accounts/{id}/tokens/verify`.
- Smoke auto sur chaque push `main` : workflow **BlackWay public journey smoke**.
