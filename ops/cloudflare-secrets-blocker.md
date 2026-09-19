# Cloudflare secrets — GitHub Actions

## Secrets requis

| Secret | Valeur |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | Jeton compte/user avec Zone DNS Edit + Workers Edit sur `blackwayconnect.com` |
| `CLOUDFLARE_ACCOUNT_ID` | `eda7fc96b400297aaa0b185a26ad1846` |

## Note

- Vérifier les jetons **compte** via `GET /accounts/{id}/tokens/verify` (pas seulement `/user/tokens/verify`).
- Deploy live : souvent **Workers Builds** (Git → Dash), Actions `Deploy site` = backup.
