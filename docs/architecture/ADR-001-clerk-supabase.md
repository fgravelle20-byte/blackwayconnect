# ADR-001: Clerk + Supabase identity

**Status:** Accepted  
**Product:** NoirRoutes (noirroutes.com)

## Context

NoirRoutes needs production authentication, organizations, and a relational store with row-level security. Identity must sync reliably into Supabase without client-side service-role keys.

## Decision

- Clerk handles signup, login, logout, organizations, and roles.
- Clerk webhooks upsert `profiles`, `organizations`, and `organization_members` in Supabase.
- Supabase RLS uses Clerk JWT claims (`sub`, org id) via helpers; browser clients use the anon key + JWT only.
- Service role is server-only (API routes, webhooks).

## Consequences

- Clerk org id and Supabase org id stay linked via `clerk_org_id` (unique).
- Identity drift is mitigated by webhook upserts; reconciliation jobs may be added later.