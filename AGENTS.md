# BlackWayConnect — règles agents (PRODUCTION LIVE)

Cette plateforme est **en production**. Pas une démo. Pas un starter. Pas un template à « recommencer ».

## Interdit (sans accord owner explicite)

- `npm create cloudflare@latest` / scaffolds / templates Cloudflare dans ce repo
- Rebuild from scratch, « greenfield », ou remplacer le site par un exemple
- Changer paiement / forfaits / Paddle / HubSpot / pipe sans passer par le payment lock
- Toucher `blackway.ca` (domaine interdit — voir `ops/BLACKWAY-CA-FORBIDDEN.md`)
- Demander à l’owner de « recommencer » ou de répéter le brief business

## Obligatoire

1. **Préserver** `blackway-site` + `blackway-pipe` + `blackway-sentinel` opérationnels
2. **Funnel** : home → diagnostic / forfaits → `/payer` (Paddle) → portail
3. **Payment lock** : `ops/payment-lock/LOCKED.json` + `node scripts/assert-payment-lock.mjs` doivent rester verts
4. Avant tout changement large : lire `INTEGRATION.md` + `ops/TWIN-TURBO-ENGINES.md`
5. Smoke : `node scripts/smoke-blackway.mjs` (ou workflow GitHub) doit rester OK

## Si quelque chose casse

Réparer le composant cassé. Ne pas recréer la plateforme.
