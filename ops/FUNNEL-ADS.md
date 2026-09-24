# Funnel ads — blackwayconnect.com

## Parcours canonique

```
Accueil (/)
  → Growth landing (/forfaits-growth)     # CTA hero principal
  → Checkout Paddle (/payer?plan=grow_hub_growth)
  → Portail (/portail?transaction_id=txn_…)
```

Alternatives :
- Grille complète : `/forfaits` → Launch / Growth / Automation → `/payer`
- Soft entry : `/diagnostic` (Twin Turbo) → sauvegarde lead → CTA forfait
- Contact (Spark / Command / Partner / Entreprise) : `/contact`

## UTM recommandés

| Source | medium | campaign |
|--------|--------|----------|
| Meta / Google | cpc | grow_hub_growth |
| LinkedIn | social | twin_turbo |
| Email | email | portail_claim |

Toujours `utm_source` + `bw_from` / `client_reference_id` côté checkout.

## Ne pas utiliser

- `vorixa.ca/pricing` pour les CTAs BlackWay
- Stripe `buy.stripe.com` sur le site public
- `blackway.ca` (interdit)

Voir `INTEGRATION.md` + `ops/TWIN-TURBO-ENGINES.md`.
