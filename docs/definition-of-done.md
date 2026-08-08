# Phase 1 — Definition of Done

Promote to PROD only when every item below is verified on PREVIEW.

## Technical checklist

- [ ] Monorepo pnpm + GitHub CI (lint, typecheck) green
- [ ] Supabase migrations applied (commerce schema + seed: 6 plans, 8 service_offers, add-ons + prices)
- [ ] Clerk signup/login/orgs/webhooks sync profiles + organizations
- [ ] RLS helpers + policies + storage buckets; policy tests pass
- [ ] Stripe Checkout (plan / add-on / studio), Portal, webhook multi-mode, `subscription_usage`
- [ ] Resend transactional emails (welcome, payment, cancel, trial, quote, onboarding)
- [ ] Sentry captures frontend + API + webhook errors
- [ ] PostHog events: `checkout_started`, `checkout_completed`, `addon_purchased`, `service_order_created`, onboarding funnel
- [ ] Marketing: 23 pages + pricing 6 sections from `/api/commerce/catalog`
- [ ] Dashboard: 15 routes with honest empty states (no fake metrics)
- [ ] Projects CRUD persisted in Supabase
- [ ] Studio: service_requests + quotes CRUD
- [ ] Support: tickets + messages CRUD
- [ ] Admin `/admin/plans` can edit limits, features, provisional prices
- [ ] Playwright critical suite green on PREVIEW URL
- [ ] Vercel DEV / PREVIEW / PROD env vars scoped; Cloudflare DNS pointed

## Tester criteria (15)

- [ ] 1. Sign up (Clerk)
- [ ] 2. Sign in
- [ ] 3. Create organization / workspace
- [ ] 4. Access protected dashboard
- [ ] 5. Create a real project in the database
- [ ] 6. Persisted data visible after refresh
- [ ] 7. Stripe Checkout in test mode
- [ ] 8. Subscription activated via webhook
- [ ] 9. Modules accessible according to plan (DB entitlements)
- [ ] 10. Receive transactional email (Resend)
- [ ] 11. Open Stripe Customer Portal
- [ ] 12. Create a service submission or quote
- [ ] 13. Errors visible in Sentry
- [ ] 14. Events visible in PostHog
- [ ] 15. Critical Playwright tests pass

## Environments

| Env | Branch | Stripe | Promote gate |
|-----|--------|--------|--------------|
| DEV | feature | test | local |
| PREVIEW | PR | test | Playwright CI |
| PROD | `main` | live | Manual after PREVIEW green |

## Related

- Deploy: [deploy.md](./deploy.md)
- Architecture ADRs: [architecture/](./architecture/)
- E2E specs: `apps/web/e2e/`
