# Stripe plumbing — BlackWayConnect (CANONICAL)

Compte LIVE: `acct_1TDZjzAG7HUL9Rtr` — **BlackWayConnect Inc**

## Verdict panique (2026-08-09)

Stripe n'a **pas** effacé 1 500 $ de ventes encaissées.
Sur ce compte LIVE au moment de l'audit :

| Mesure | Valeur |
|---|---|
| Charges réussies | **0** |
| Checkout sessions payées | **0** (96 unpaid = tests) |
| Abonnements actifs | **0** |
| Solde disponible | **-0,66 CAD** (frais taxe Stripe) |
| Clients fiche | ~51 (surtout tests Base44 / `f.gravelle20@icloud.com`) |
| Facture ouverte | HydroFix / Vorixa Accélération **113,83 $ CAD** (non payée) |

Les « 16 clients / 1 500 $ » vus au Dashboard étaient des **fiches / projections / autre produit**, pas de l'argent Stripe encaissé puis perdu.

## Tuyauterie verrouillée

### Payment Links canoniques (montants = site)

| Forfait | Montant | Lien |
|---|---|---|
| Grow Hub Launch | 299 $/mois | https://buy.stripe.com/4gM8wO8216F52ZEeZMeIw0J |
| Grow Hub Growth | 749 $/mois | https://buy.stripe.com/eVq9AScihfbBbwa5pceIw0I |
| Grow Hub Scale | 1 495 $/mois | https://buy.stripe.com/bJedR81DD8Nd57M3h4eIw0K |
| Site haute conversion | 1 995 $ | https://buy.stripe.com/7sY28qgyx5B10Rw04SeIw0M |
| Système de revenus | 4 995 $ | https://buy.stripe.com/eVq6oGdmld3tcAe8BoeIw0L |
| App mobile / IA | 7 995 $ | https://buy.stripe.com/00w9AS4PPbZpdEibNAeIw0N |

Anciens liens « launch pricing » 69/129/199 **désactivés**.

### Webhook canonical

`https://api.blackwayconnect.com/webhooks/stripe` (enabled)

Stale Emergent preview webhook **disabled**.

Attention : ce même compte Stripe héberge aussi Vorixa / UNEXA / Factura / GetProforma / Supabase — ne pas supprimer leurs webhooks sans validation métier.

### Projets

1. **blackwayconnect (Railway)** — site + `/api/v1/payments/buy/{plan}` → Payment Links ci-dessus
2. **blackway-pipe** — leads HubSpot (`/lead`) ; health doit avoir `hubspot:true` ; remettre `STRIPE_SECRET_KEY` si portal claim
3. **bw-stripe-webhook** — worker repo ; déployer OU utiliser api.blackwayconnect.com
4. **blackway-engine** — logique forfaits ; ne plus pointer d'anciens buy.stripe.com

## Emails (verrouillé)

**Adresse sauvegardée :** `serviceclient@blackwayconnect.com`

| Email | Rôle |
|---|---|
| `serviceclient@blackwayconnect.com` | **UNIQUE** — support, Stripe business, alertes, FROM |
| `accounting@blackwayconnect.com` | Comptabilité |
| `f.gravelle20@icloud.com` | **INTERDIT** dans les apps |

Voir `artifacts/EMAIL-CANONICAL-POLICY.md`.

Stripe Dashboard (manuel, 1 fois) :
- Login team → `serviceclient@blackwayconnect.com`
- Connect emails recipients → même adresse
- Ne plus créer de comptes Base44/Connect avec l’iCloud
