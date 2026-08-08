# Cloudflare — NoirRoutes

## DNS

| Record | Name | Target |
|--------|------|--------|
| CNAME / ALIAS | `@` (apex `noirroutes.com`) | Vercel |
| CNAME | `www` | `cname.vercel-dns.com` (or redirect to apex) |
| CNAME | `app` (`app.noirroutes.com`) | Vercel project for SaaS dashboard |

## SSL

- Mode: Full (Strict)
- Always Use HTTPS: On

## Security

- WAF: rate-limit `/api/webhooks/*` (Clerk + Stripe)
- Bot Fight Mode: optional on marketing
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or Stripe secrets through edge workers

## Environments

1. DEV — localhost
2. PREVIEW — Vercel Preview URLs (Stripe test)
3. PROD — `noirroutes.com` + `app.noirroutes.com` (Stripe live)

Promote to PROD only after Playwright CI is green on PREVIEW.