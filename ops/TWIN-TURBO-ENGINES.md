# Twin Turbo Full Performance — BlackWayConnect

Ordre owner : **leads d’abord**. Les moteurs passent en Twin Turbo Full Performance.

## Moteurs

| Turbo | Rôle | Signaux |
|-------|------|---------|
| **A — Volume** | Pression d’intake | volume leads / mois, bilingualité |
| **B — Qualité** | Pression de close | vitesse relance, CRM, taux close, paiements |
| **Twin** | Blend 42 % A + 58 % B | `bw_lead_score` HubSpot |

Mode code : `twin_turbo_full_performance` (`src/leadEngines.ts`).

## Flux chirurgical

1. Diagnostic `/diagnostic` → Twin Turbo (UI)  
2. `POST /api/lead` avec `leak_score`, `volume_turbo`, `quality_turbo`, `twin_score`, `band`, `answers`  
3. Pipe `traiterLead` → blend CRM + note structurée Twin Turbo  
4. `/ops/overview` → `engines.avgLeadScore` / deals scorés (preuve ops)

## Forfaits Paddle self-serve

Recommandation moteur → **Launch / Growth / Scale** seulement (pas Spark/Command en auto-checkout).

## Ne pas toucher

- Grilles Vorixa / `vorixaManaged.js`
- Domaine interdit `blackway.ca` (`ops/BLACKWAY-CA-FORBIDDEN.md`)
