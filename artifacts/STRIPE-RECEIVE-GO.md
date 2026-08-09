# STRIPE RECEIVE — GO LIVE CHECK (2026-08-09)

## GO — prêt à recevoir de l’argent

| Check | Résultat |
|---|---|
| Stripe `charges_enabled` | **true** |
| Stripe `payouts_enabled` | **true** |
| Compte | `acct_1TDZjzAG7HUL9Rtr` BlackWayConnect Inc |
| 6 Payment Links KING | **active** + HTTP 200 |
| Redirect post-paiement | → `dependable-spirit-production.up.railway.app/?paid=1` |
| Site prod Railway | **healthy 2.1.0** |
| `/buy/{plan}` × 6 | **303 → buy.stripe.com KING** |
| Webhook canonical | `blackway-pipe…/webhooks/stripe` **enabled** (sig check OK) |
| Pipe HubSpot | `hubspot:true` |

## URL PROD ACTUELLE (Railway a été reconstruit)
**https://dependable-spirit-production.up.railway.app**

Ancien `blackwayconnect-production.up.railway.app` = **mort** (404).

## Liens d’encaissement KING
- Launch 299 : https://buy.stripe.com/4gM8wO8216F52ZEeZMeIw0J
- Growth 749 : https://buy.stripe.com/eVq9AScihfbBbwa5pceIw0I
- Scale 1495 : https://buy.stripe.com/bJedR81DD8Nd57M3h4eIw0K
- Site 1995 : https://buy.stripe.com/7sY28qgyx5B10Rw04SeIw0M
- Revenue 4995 : https://buy.stripe.com/eVq6oGdmld3tcAe8BoeIw0L
- App 7995 : https://buy.stripe.com/00w9AS4PPbZpdEibNAeIw0N

## Encore hors scope (n’empêche PAS d’encaisser)
- `www.blackwayconnect.com` cutover Cloudflare (token manquant)
- `STRIPE_SECRET_KEY` sur pipe (portal claim seulement)

## Comment encaisser MAINTENANT
1. Envoie un lien KING ci-dessus **ou**  
   `https://dependable-spirit-production.up.railway.app/api/v1/payments/buy/grow_hub_launch`
2. Client paie sur Stripe Checkout
3. Webhook → HubSpot via blackway-pipe
