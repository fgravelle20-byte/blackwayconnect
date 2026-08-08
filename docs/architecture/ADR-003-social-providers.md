# ADR-003: Social providers (deferred OAuth)

**Status:** Accepted  
**Product:** NoirRoutes (noirroutes.com)

## Context

Social distribution is a later phase. Shipping fake connect buttons or invented publish status would violate the no-mock-data rule.

## Decision

- Seed `social_platforms` with `api_status = unavailable` and capabilities `oauth: false`.
- UI is capability-driven: Connect only when DB capabilities allow.
- Provider implementations live in `@noirroutes/social-providers` and stay empty until validated.

## Consequences

- Phase 1 shows honest unavailable states.
- Enabling a provider is a data + code change, not a UI-only toggle.