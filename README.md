# BlackWayConnect — MASTER KING PLATFORM

**Une seule plateforme.** Tout le reste est faux / legacy.

Lis d’abord : [`artifacts/MASTER-KING-PLATFORM.md`](artifacts/MASTER-KING-PLATFORM.md)

## KING (utiliser uniquement ça)

| Quoi | Où |
|---|---|
| Site / API | https://dependable-spirit-production.up.railway.app |
| Domaine cible | https://blackwayconnect.com (après cutover Cloudflare) |
| Stripe account | `acct_1TDZjzAG7HUL9Rtr` |
| Webhook | https://blackway-pipe.f-gravelle20.workers.dev/webhooks/stripe |
| Email | serviceclient@blackwayconnect.com |
| PR à merger | #13 `cursor/stripe-plumbing-lock-381b` |

### Forfaits KING
- Grow Hub Launch **299 $/mois** → https://buy.stripe.com/4gM8wO8216F52ZEeZMeIw0J
- Grow Hub Growth **749 $/mois** → https://buy.stripe.com/eVq9AScihfbBbwa5pceIw0I
- Grow Hub Scale **1 495 $/mois** → https://buy.stripe.com/bJedR81DD8Nd57M3h4eIw0K
- Site haute conversion **1 995 $** → https://buy.stripe.com/7sY28qgyx5B10Rw04SeIw0M
- Système de revenus **4 995 $** → https://buy.stripe.com/eVq6oGdmld3tcAe8BoeIw0L
- App mobile / IA **7 995 $** → https://buy.stripe.com/00w9AS4PPbZpdEibNAeIw0N

## FAUX (ne plus toucher)
Voir [`artifacts/FAUX-BLACKWAY-BLACKLIST.md`](artifacts/FAUX-BLACKWAY-BLACKLIST.md)  
ChatGPT Sites · Emergent previews · anciens webhooks · dossiers `services/*/LEGACY.md`

## Repo utile
- `main.py` + `templates/` + `modules/payments/` → site KING
- `src/index.js` + `wrangler.toml` → proxy Cloudflare → Railway (cutover domaine)
- `services/blackway-engine` · `services/bw-stripe-webhook` → **LEGACY**
