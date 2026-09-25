# Audit Master BlackWayConnect — 2026-09-25

Audit chirurgical (pas de rebuild). Source de vérité prix : `src/stripeConfig.ts` + Paddle `src/paddleCatalog.ts`.

## Verdict

La plateforme **est live** (smoke public vert, Workers déployés). Les bugs majeurs étaient des **mensonges de catalogue** (secrétaire IA / SEO Worker encore sur d’anciens prix Stripe).

## P0 — corrigé dans ce master update

| Bug | Impact | Fix |
|-----|--------|-----|
| `worker/chat.ts` prix Launch 249 / Growth 499 / Scale 749 | Secrétaire IA cite de faux prix | Aligné 149 / 349 / 699 + Paddle |
| `worker/seoInject.ts` Growth 499 $ + Stripe | Crawlers / partages sociaux faux | Aligné 349 $ + Paddle |
| `/forfaits` n’affichait que 3 plans (« Automation ») | Grille incomplète vs catalogue Spark→Partner | `copy.ts` grille 6 forfaits, Scale correct |

## P1 — corrigé

- Compare / Tools : plage 99→2499 + Paddle (plus Stripe / 2349)
- SEO page forfaits : Spark→Partner
- Copy PricingPage : « Automation » → Scale + mention grille complète
- Payment lock + `AGENTS.md` (anti-rebuild agents)

## P2 — prochaines étapes owner (hors code ou unlock)

1. **Paddle** : créer prices self-serve pour Spark / Command / Partner (et éventuel palier ~5000 $ Entreprise) si tu veux tout payer en ligne 199–5000
2. **Unlock payment lock** seulement pour brancher de nouveaux `pri_…` (voir `ops/payment-lock/README.md`)
3. **www DNS** : lancer workflow `Repair www.blackwayconnect.com DNS` si www ne résout pas
4. **Owner `/controle`** : activer Cloudflare Access (secrets `CF_ACCESS_*` + `BW_OWNER_EMAIL`) — doc `ops/OWNER_CONSOLE.md`
5. **Pack Cellulaire** : Payment Links Stripe encore vides (`STRIPE_CELLULAIRE_CHECKLIST.md`)

## Ce qui reste volontairement intact

- Chaîne Paddle live Launch / Growth / Scale (locked)
- Twin Turbo diagnostic → HubSpot
- Portail claim / provision
- Workers `blackway-site` / `blackway-pipe` / `blackway-sentinel`
