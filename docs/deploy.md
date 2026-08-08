# Deploy — DEV / PREVIEW / PROD

## Definition of Done

Complete [definition-of-done.md](./definition-of-done.md) before promoting to PROD.

## Domains

| Host | Role |
|------|------|
| `noirroutes.com` / `www.noirroutes.com` | Marketing site (Vercel) |
| `app.noirroutes.com` | SaaS dashboard (same Vercel project or path rewrite) |

## Cloudflare

1. Point `noirroutes.com` and `www` to Vercel (apex ALIAS/A or CNAME as required).
2. Point `app.noirroutes.com` to the same Vercel project.
3. SSL Full (Strict); Always Use HTTPS.
4. Rate-limit `/api/webhooks/*` (Clerk + Stripe).

## Vercel

1. Import GitHub repo.
2. Root directory: monorepo root; Framework preset Next.js; build uses `pnpm --filter @noirroutes/web build` (see `vercel.json`).
3. Environment variables per environment from `.env.example` — set `APP_ENV` to `DEV` / `PREVIEW` / `PROD`.
4. Set `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_APP_NAME=NoirRoutes` per env.
5. Production branch: `main`. Promote only after Preview E2E green.
6. Optional Preview Protection password for staging.

## Supabase

- DEV: local or dedicated project (US Virginia region).
- PREVIEW/staging: separate project.
- PROD: separate project; run migrations via GitHub Action (`supabase-migrate.yml`) after approval.
- Enable Clerk as third-party auth; JWT template must include `sub` (= clerk_user_id) and optionally `org_id`.

## Stripe

- DEV/PREVIEW: test mode keys + webhook to Preview URL.
- PROD: live keys; sync product/price IDs into `plans` / `plan_prices` / `add_on_prices` via Admin before going live.
- Never store Stripe price IDs in env — database only.

## Clerk

- Separate Clerk applications for DEV vs PROD.
- Enable Organizations + webhook endpoints for user/org/membership sync.
- JWT template for Supabase third-party auth.
- Allowed origins / redirect URLs must include `https://noirroutes.com` and `https://app.noirroutes.com`.

## Rollback

- Vercel: instant rollback to previous deployment.
- DB: forward-only migrations; no destructive changes without backup.
