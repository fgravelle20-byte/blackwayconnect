# ADR-002: Multi-tenant RLS

**Status:** Accepted  
**Product:** NoirRoutes (noirroutes.com)

## Context

All tenant data (projects, quotes, tickets, billing mirrors) must be isolated by organization. UI-only gating is insufficient.

## Decision

- Every tenant table includes `organization_id` (or equivalent) and RLS policies that check membership via Clerk JWT helpers.
- Plan limits and features are enforced with DB helpers (`plan_limits`, `plan_features`, usage tables), not hardcoded UI numbers.
- Storage buckets use org-scoped policies.

## Consequences

- Cross-tenant reads/writes fail at the database layer even if an API bug occurs.
- Platform admins use an explicit `platform_admins` gate for admin routes.