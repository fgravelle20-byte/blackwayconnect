# BLACKWAYCONNECT — Démarrer le moteur (step-by-step)

## Pourquoi vous ne voyez qu’une vitrine

Le health check (`/api/health`) montre actuellement :

| Intégration | État |
|-------------|------|
| clerk | OFF |
| supabase | OFF |
| stripe | OFF |
| resend | OFF |

Sans ces 3 clés (Clerk + Supabase + Stripe test), **auth, pricing DB, checkout et dashboard CRUD ne peuvent pas fonctionner**.

## Step 1 — Turbo monorepo

```powershell
cd C:\Users\suppo\Projects\blackwayconnect
pnpm install
pnpm db:start          # Supabase local (Docker)
pnpm db:reset          # migrations + seed
pnpm dev               # Next via Turbo
```

Ouvrir http://localhost:3000 — le panneau **ENGINE STATUS** sur la home affiche ON/OFF en direct.

## Step 2 — Brancher Supabase local (automatique)

Après `pnpm db:start` :

```powershell
pnpm exec node scripts/sync-supabase-env.mjs
```

Cela écrit `NEXT_PUBLIC_SUPABASE_*` et `SUPABASE_SERVICE_ROLE_KEY` dans `apps/web/.env.local`.

Vérifier : http://localhost:3000/api/commerce/catalog → doit renvoyer les 6 plans.

## Step 3 — Clerk (obligatoire pour login/dashboard)

1. Créer une app sur https://dashboard.clerk.com
2. Activer **Organizations**
3. Copier Publishable Key + Secret Key dans `apps/web/.env.local`
4. Webhook (optionnel DEV) : `http://localhost:3000/api/webhooks/clerk`
5. Redémarrer `pnpm dev`

## Step 4 — Stripe test (obligatoire pour checkout)

1. https://dashboard.stripe.com/test/apikeys
2. Copier Publishable + Secret dans `.env.local`
3. Créer Products/Prices pour Starter…Agency
4. Mettre les vrais `stripe_price_id` dans la table `plan_prices` (Admin → Plans ou SQL)
5. Stripe CLI : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Step 5 — Vérification Definition of Done

| Check | URL / action |
|-------|----------------|
| Health | `/api/health` → clerk/supabase/stripe true |
| Catalog | `/api/commerce/catalog` → plans |
| Signup | `/en/sign-up` |
| Onboarding | `/en/onboarding` |
| Dashboard | `/en/dashboard` |
| Projects CRUD | `/en/dashboard/projects` |
| Checkout | `/en/pricing` → Stripe test |

## Commandes Turbo utiles

```powershell
pnpm typecheck
pnpm build
pnpm db:status
pnpm db:stop
```
