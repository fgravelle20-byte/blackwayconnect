# NoirRoutes

**Create. Automate. Scale.** / **Créer. Automatiser. Propulser.**

SaaS AI platform + execution studio for businesses, creators, agencies, and enterprises.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Clerk (auth, organizations, roles)
- Supabase (Postgres, RLS, Storage)
- Stripe Billing (subscriptions, checkout, portal, webhooks)
- Resend, Sentry, PostHog, Playwright
- Vercel + Cloudflare

## Monorepo

```
apps/web                 Next.js SaaS + marketing
packages/database        Shared DB types
packages/ui-tokens       Design tokens
packages/social-providers Provider registry (no OAuth yet)
supabase/                Migrations + seed
```

## Quick start (DEV)

1. Copy `.env.example` → `apps/web/.env.local` and fill Clerk, Supabase, Stripe **test** keys.
2. `pnpm install`
3. Apply migrations: `npx supabase db push` (or link your project)
4. Seed: `npx supabase db seed` (or run `supabase/seed.sql`)
5. `pnpm dev` → http://localhost:3000

## Environments

| Env | Stripe | Deploy |
|-----|--------|--------|
| DEV | test | localhost |
| PREVIEW | test | Vercel Preview on PR |
| PROD | live | Vercel Production + Cloudflare DNS |

Never put Stripe `price_id` values in env files — they live in `plan_prices` / `add_on_prices` in the database.

## Domains

- Marketing: `https://noirroutes.com`
- App: `https://app.noirroutes.com`

## Plans (DB-driven)

Starter → Growth → Business → Scale → Agency → Enterprise

Pricing page loads from `/api/commerce/catalog`. Edit via Admin → Plans.

## License

Proprietary — NoirRoutes

## Definition of Done

See [docs/definition-of-done.md](./docs/definition-of-done.md) before promoting PREVIEW → PROD.
