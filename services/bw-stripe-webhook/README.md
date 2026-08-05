# BlackWayConnect — Webhook Stripe → HubSpot

Handler complet `checkout.session.completed`. Transforme chaque paiement Stripe en Deal HubSpot au stage **Paiement reçu**, avec contact, entreprise, note d'audit, ticket de livraison et alerte Slack — sans aucune intervention manuelle.

## Chaîne automatisée

```
Paiement Stripe (checkout.session.completed)
  ├─ Vérification signature (whsec_)
  ├─ Garde anti-doublon (event.id + bw_stripe_payment_id)
  ├─ Résolution du forfait (metadata → price_id → nom produit)
  ├─ Calcul du lead score (0-100)
  ├─ Contact HubSpot        (upsert par courriel, lifecycle = customer)
  ├─ Company                (si courriel professionnel)
  ├─ Deal « BlackWay – Revenue » stage « Paiement reçu »
  ├─ Note d'audit           (détail Stripe horodaté)
  ├─ Ticket de livraison    (priorité selon montant)
  └─ Alerte Slack           (lien direct vers la fiche deal)
```

## Configuration verrouillée

| Élément | Valeur |
|---|---|
| Portail HubSpot | `343472254` |
| Pipeline | `BlackWay – Revenue` — `2117849055` |
| Stage cible | `Paiement reçu` — `3584700395` |

### Mapping des 6 forfaits

Le point critique : Stripe stocke `bw_forfait` en **libellé lisible**, HubSpot en **snake_case**. La table de correspondance vit dans `src/config.js`.

| Stripe `bw_forfait` | HubSpot `bw_forfait` | Price ID | Montant | Délai |
|---|---|---|---|---|
| Website & Lead Launch (Site haute conversion) | `website_lead_launch` | `price_1U0CWRAG7HUL9RtrKszbmNvn` | 1 995 $ | 21 j |
| Revenue System | `revenue_system` | `price_1U0CWYAG7HUL9RtrqiOYoSVL` | 4 995 $ | 35 j |
| AI Scale (App mobile) | `ai_scale` | `price_1U0CWYAG7HUL9RtrEHxzww0T` | 7 995 $ | 45 j |
| Grow Hub Launch | `grow_hub_launch` | `price_1U0CWiAG7HUL9RtrKaR00BRz` | 299 $/mois | 7 j |
| Grow Hub Growth | `grow_hub_growth` | `price_1U0CWhAG7HUL9RtrRUDlmp9v` | 749 $/mois | 7 j |
| Grow Hub Scale | `grow_hub_scale` | `price_1U0CWqAG7HUL9RtrwZ66aT90` | 1 495 $/mois | 7 j |

> Grille corrigée du 4–5 août 2026. Les `price_id` historiques restent pour la résolution ; créer de nouveaux Price Stripe aux montants corrigés avant publication des liens de paiement.

## Installation

```bash
npm install
cp .env.example .env   # puis remplir les clés
npm start
```

Vérification : `curl http://localhost:8080/health`

## Test local sans risque

```bash
DRY_RUN=1 npm test        # 15 assertions, aucun appel réel
```

Avec la CLI Stripe :

```bash
stripe listen --forward-to localhost:8080/webhooks/stripe
stripe trigger checkout.session.completed
```

## Mise en production

1. Déployer sur un domaine HTTPS (ex. `webhooks.blackwayconnect.com`).
2. Stripe → Developers → Webhooks → **Add endpoint**
   - URL : `https://webhooks.blackwayconnect.com/webhooks/stripe`
   - Événements : `checkout.session.completed` et `checkout.session.async_payment_succeeded`
3. Copier le `whsec_...` dans `STRIPE_WEBHOOK_SECRET`.
4. Ajouter `HUBSPOT_TOKEN` (private app du portail 343472254).
5. Optionnel : `SLACK_WEBHOOK_URL` pour les alertes temps réel.

## Robustesse

- **Réponse 200 immédiate** puis traitement asynchrone — évite le timeout Stripe de 10 s qui provoque des rejeux.
- **Double idempotence** : cache `event.id` sur 7 jours + recherche `bw_stripe_payment_id` dans HubSpot avant chaque création de deal.
- **Retry exponentiel** sur les 429 et 5xx HubSpot (3 tentatives).
- **Échec non marqué comme traité** : Stripe rejoue, la garde CRM empêche le doublon.
- **Ticket de livraison non bloquant** : si le scope `tickets` manque, le reste de la chaîne aboutit quand même.

## Scoring

Base par forfait (70 à 95) + 5 si abonnement + 5 si montant ≥ 4 000 $ + 5 si courriel professionnel. Plafonné à 100. Alimente `bw_lead_score` sur le contact et le deal.

## Sources

- [Documentation Stripe – checkout.session.completed](https://docs.stripe.com/api/events/types#event_types-checkout.session.completed)
- [HubSpot CRM API v3 – Objects](https://developers.hubspot.com/docs/api/crm/understanding-the-crm)
