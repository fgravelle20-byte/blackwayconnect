# BLACKWAYCONNECT — TOUT-EN-UN (tuyauterie)
**Une seule page. Tout ce qu’il faut pour que ça marche.**  
Mis à jour : 2026-08-09

---

## 1) RÈGLE D’OR
Si ce n’est **pas** listé ici → **ce n’est pas BlackWay**. Ignore.

Email unique : **`serviceclient@blackwayconnect.com`**

---

## 2) OÙ TOURNE LE PRODUIT (KING)

| Rôle | Valeur |
|---|---|
| **Site / API prod** | https://dependable-spirit-production.up.railway.app |
| **Santé** | https://dependable-spirit-production.up.railway.app/health |
| **Acheter (exemple)** | https://dependable-spirit-production.up.railway.app/api/v1/payments/buy/grow_hub_launch |
| **Repo code** | https://github.com/fgravelle20-byte/blackwayconnect (`main`) |
| **Compte Stripe** | `acct_1TDZjzAG7HUL9Rtr` — BlackWayConnect Inc (CA / CAD) |
| **HubSpot** | Portail `343472254` — BlackWayConnect |
| **Leads + webhook paiements** | https://blackway-pipe.f-gravelle20.workers.dev |
| **Domaine public cible** | https://www.blackwayconnect.com (cutover Cloudflare **à faire**) |

Ancien `blackwayconnect-production.up.railway.app` = **MORT**. Ne plus utiliser.

---

## 3) STRIPE — ENCAISSER (6 forfaits KING seulement)

| Forfait | Prix | Lien / buy |
|---|---|---|
| Grow Hub Launch | 299 $/mois | https://buy.stripe.com/4gM8wO8216F52ZEeZMeIw0J |
| Grow Hub Growth | 749 $/mois | https://buy.stripe.com/eVq9AScihfbBbwa5pceIw0I |
| Grow Hub Scale | 1 495 $/mois | https://buy.stripe.com/bJedR81DD8Nd57M3h4eIw0K |
| Site haute conversion | 1 995 $ | https://buy.stripe.com/7sY28qgyx5B10Rw04SeIw0M |
| Système de revenus | 4 995 $ | https://buy.stripe.com/eVq6oGdmld3tcAe8BoeIw0L |
| App mobile / IA | 7 995 $ | https://buy.stripe.com/00w9AS4PPbZpdEibNAeIw0N |

Ou via site :  
`/api/v1/payments/buy/{plan_id}`  
avec `plan_id` = `grow_hub_launch` · `grow_hub_growth` · `grow_hub_scale` · `website_lead_launch` · `revenue_system` · `ai_scale`

**Webhook Stripe (canonical) :**  
`https://blackway-pipe.f-gravelle20.workers.dev/webhooks/stripe`  
Events : checkout completed / async paid / invoice paid / expired / failed

Post-paiement redirect :  
`https://dependable-spirit-production.up.railway.app/?paid=1`

---

## 4) FLUX COMPLET (comment l’argent / leads circulent)

```
Client → Railway /buy OU buy.stripe.com KING
      → Stripe Checkout (CAD)
      → Webhook → blackway-pipe → HubSpot (deal / forfait)

Formulaire lead → blackway-pipe /lead → HubSpot (contact)
```

---

## 5) VARIABLES OBLIGATOIRES (à avoir au même endroit)

### Railway (service `dependable-spirit`)
| Variable | Statut |
|---|---|
| `STRIPE_SECRET_KEY` | **Mettre la vraie** `sk_live_…` (pas le placeholder) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (si webhook aussi sur Railway) |
| `HUBSPOT_TOKEN` | optionnel si leads via pipe seulement |
| Port / start | Procfile / FastAPI déjà OK |

### Cloudflare Worker `blackway-pipe`
| Variable | Statut |
|---|---|
| `HUBSPOT_TOKEN` | **OK** (`hubspot:true`) |
| `STRIPE_WEBHOOK_SECRET` | **OK** |
| `STRIPE_SECRET_KEY` | manquant (portal claim seulement) |
| `LEAD_KEY` | **OK** |

### Cloudflare Worker site `blackwayconnect` (proxy domaine)
| Variable | Statut |
|---|---|
| Code `src/index.js` | ORIGIN = Railway KING ci-dessus |
| Domaines `www` + apex | **À attacher** (besoin token CF) |

---

## 6) HUBSPOT — quand une opportunité arrive
1. Te mettre **propriétaire**
2. Lier **contact + entreprise**
3. Champ **Forfait** = un des 6 KING
4. Montant = prix CAD du forfait
5. Envoyer le **lien Stripe KING**
6. Avancer le pipeline

---

## 7) LISTE NOIRE (ne plus toucher / ne plus payer)
- ChatGPT Sites `…chatgpt.site`
- Emergent previews
- Replit / Emergent **mobile** (doublons)
- Anciens prix 129 / 299 / 599 affichés hors KING
- `api.blackwayconnect.com/webhooks/stripe` (CF challenge)
- Services repo `services/blackway-engine` + `services/bw-stripe-webhook` = **LEGACY**

Détail : `artifacts/FAUX-BLACKWAY-BLACKLIST.md`

---

## 8) CHECK GO / NO-GO (recevoir de l’argent)

| Item | GO ? |
|---|---|
| Stripe charges + payouts | **GO** |
| 6 liens KING actifs | **GO** |
| Railway `/buy` → Stripe | **GO** |
| Webhook pipe | **GO** |
| HubSpot leads | **GO** |
| www.blackwayconnect.com = Railway | **NO** (cutover CF) |
| `sk_live` réelle sur Railway | **À coller** (placeholder aujourd’hui) |

**Tu peux encaisser MAINTENANT** avec les liens KING / Railway.  
Le domaine officiel + vraie clé Stripe Railway = finition.

---

## 9) FICHIERS DU REPO (tout le reste pointe ici)

| Fichier | Rôle |
|---|---|
| **`artifacts/TOUT-EN-UN.md`** | **CETTE page — source unique** |
| `modules/payments/payments.py` | Catalogue PRICE_IDS + liens |
| `modules/payments/router.py` | `/plans` `/buy` `/status` |
| `src/index.js` + `wrangler.toml` | Proxy CF → Railway |
| `scripts/cf-cutover-king.sh` | Deploy CF quand token dispo |
| `artifacts/STRIPE-RECEIVE-GO.md` | Check receive |
| `artifacts/MASTER-KING-PLATFORM.md` | Vision KING |
| `artifacts/CUTOVER-CLOUDFLARE.md` | Étapes domaine |
| `config/emails.py` | Email unique |

---

## 10) ACTION IMMÉDIATE (ordre)
1. Vendre avec liens §3 ou Railway `/buy/…`
2. Coller `sk_live_…` dans Railway Variables
3. Cutover `www.blackwayconnect.com` (token Cloudflare)
4. Ranger les deals HubSpot (forfait + proprio)
