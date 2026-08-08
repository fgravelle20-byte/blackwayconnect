# ADR-004: Commercial pricing in the database

**Status:** Accepted  
**Product:** NoirRoutes (noirroutes.com)

## Context

Stripe price IDs and provisional amounts must not live in environment variables. Marketing pricing and checkout must stay DB-driven.

## Decision

- Catalog: `plans`, `plan_prices` (monthly/yearly, `amount_cents`, `annual_discount_percent`, `stripe_price_id`, `is_active`), `plan_limits`, `plan_features`, `add_ons`, `service_offers`.
- Public API: `GET /api/commerce/catalog`.
- Admin `/admin/plans` (platform admins) can edit limits, features, and provisional prices.
- Checkout sessions resolve `stripe_price_id` from `plan_prices` only.

## Consequences

- DEV seed prices are provisional; replace Stripe IDs via admin before PROD.
- Pricing page renders six sections from catalog data, not hardcoded cards.