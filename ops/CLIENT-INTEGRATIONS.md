# Client connections — implementation and activation

## Current delivery

The `/portail/connexions` and `/en/portail/connexions` pages provide Google Calendar, Microsoft Outlook Calendar and Atlassian Jira connections. API: `/api/integrations` on `blackway-site`. This is an integration inside the existing application, not a ChatGPT plugin installation and not an external rebuild.

Each customer authorizes their own account. Read-only v1: 20 appointments in the next 30 days for each calendar; up to 10 assigned open Jira issues per authorized site, capped at 5 sites. No email sending, task edits, or billing changes. Provider subscriptions remain separate. No imported data is persisted; only encrypted tokens and session/state metadata are stored.

## Activation blockers — not live until completed

1. Cloudflare authentication is unavailable in the implementation session. Do not claim deployment.
2. Create a dedicated D1 database and bind it as `BW_INTEGRATIONS_DB` on `blackway-site`. Apply `migrations/integrations/0001.sql` to that database. Add the actual database ID and migration directory to the existing Wrangler configuration; never invent an ID or replace existing bindings.
3. Generate 32 random bytes encoded as unpadded base64url; store only as Worker secret `BW_INTEGRATIONS_KEY`. Do not rotate without migrating/re-encrypting existing rows, or require customers to reconnect after removing old credentials.
4. Register the provider OAuth applications, complete the applicable provider verification/distribution steps, and set Worker secrets (never VITE variables):

| Provider | Secrets | Registered callback |
| --- | --- | --- |
| Google | BW_GOOGLE_CLIENT_ID, BW_GOOGLE_CLIENT_SECRET | https://blackwayconnect.com/api/integrations/google/callback |
| Microsoft | BW_MICROSOFT_CLIENT_ID, BW_MICROSOFT_CLIENT_SECRET | https://blackwayconnect.com/api/integrations/microsoft/callback |
| Atlassian | BW_ATLASSIAN_CLIENT_ID, BW_ATLASSIAN_CLIENT_SECRET | https://blackwayconnect.com/api/integrations/atlassian/callback |

Google: enable Calendar API; configure external consent and verification as required. Microsoft: register a confidential web app with accounts in organizational directories and personal Microsoft accounts. Atlassian: enable OAuth 2.0 (3LO), Jira API scopes, and distribution for customers. Exact requested scopes and fixed endpoints are in `worker/integrationProviders.ts`. Register the callback as Web for Microsoft, not SPA.

Without the binding, encryption key and provider credentials, the UI truthfully shows “En préparation” and disables authorization. This is not a successful connection.

## Identity and isolation

The legacy portal uses a customer email claim without independent proof of mailbox ownership. Therefore its localStorage token is deliberately NOT accepted for access to external customer data. A fresh Google or Microsoft OAuth authorization establishes identity by calling the provider UserInfo endpoint server-side. Workspace owner is the provider-prefixed immutable `sub`, never a browser-supplied email. Return with the same initial provider/account to find the same workspace. Signing in through another provider while logged out creates a separate workspace; account merging is not implemented.

The owner can connect another provider/account after sign-in, including Jira. No shared owner/company provider token is reused. Session cookies are random, HttpOnly, Secure and SameSite=Lax; only session hashes are stored. OAuth state is random, browser-bound, expiring, provider-bound and consumed atomically. Google and Microsoft additionally use PKCE S256. Authorization errors are scrubbed from callback redirects. API responses are no-store. Mutations require exact same origin. Production callback host is fixed; preview hosts are intentionally refused.

Tokens are AES-256-GCM encrypted with owner/provider-bound authenticated data. Rotating refresh tokens use a D1 lock and optimistic version check. Disconnect deletes credentials and pending authorizations for that owner/provider. This removes BlackWay access but does not revoke the provider-side grant; the UI links to provider settings. Sign-out clears the current server session and its pending authorizations, but retains stored connections for next sign-in. Other sessions are not signed out. Sessions expire after seven days; states after ten minutes. Expired rows are cleaned on the next authorization start.

## Verification

- `npm run build`
- `node --test tests/integrations.test.mjs` (Node 22+ with node:sqlite; mocked provider HTTP, real SQLite SQL)
- `node scripts/assert-payment-lock.mjs` — preserve the existing lock state; do not relock or edit payment configuration here.
- `node scripts/smoke-blackway.mjs`
- Before live activation: authorize with two separate test customers; confirm tenant isolation, consent cancellation, refresh, provider revocation, removal, sign-out and mobile layout with each real provider.

Live provider approval, consent, refresh and data access have NOT been validated without production app registrations. A successful unit test does not prove a live connection.

## Provider references

- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/workspace/calendar/api/v3/reference/events/list
- https://learn.microsoft.com/en-us/graph/auth-v2-user
- https://learn.microsoft.com/en-us/entra/identity-platform/userinfo
- https://learn.microsoft.com/en-us/graph/api/user-list-calendarview
- https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
- https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/

Atlassian Rovo was searched in the connected Vorixa workspace; no BlackWay connector implementation specification was found in the available results. The requested app_block capability was not exposed in this session. Neither blocks implementing the feature in the existing repository.
