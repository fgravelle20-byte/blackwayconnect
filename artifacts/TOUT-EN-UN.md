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
| **Compte Stripe** | `acct_1U1zzdEWku3DPVf3` — **seul** compte (CA / CAD). Ancien `…AG7HUL9Rtr` à fermer. |
| **HubSpot** | Portail `343472254` — BlackWayConnect |
| **Leads + webhook paiements** | https://blackway-pipe.f-gravelle20.workers.dev |
| **Domaine public cible** | https://www.blackwayconnect.com (cutover Cloudflare **à faire**) |

Ancien `blackwayconnect-production.up.railway.app` = **MORT**. Ne plus utiliser.

---

## 3) STRIPE — ENCAISSER (6 forfaits KING seulement)

| Forfait | Prix | Achat |
|---|---|---|
| Grow Hub Launch | 299 $/mois **ou** 3 157,44 $/an (−12 %) | `/buy/grow_hub_launch?billing=monthly\|annual` |
| Grow Hub Growth | 749 $/mois **ou** 7 909,44 $/an (−12 %) | `/buy/grow_hub_growth?billing=…` |
| Grow Hub Scale | 1 495 $/mois **ou** 15 787,20 $/an (−12 %) | `/buy/grow_hub_scale?billing=…` |
| Site haute conversion | 1 995 $ (unique) | `/buy/website_lead_launch` |
| Système de revenus | 4 995 $ (unique) | `/buy/revenue_system` |
| App mobile / IA | 7 995 $ (unique) | `/buy/ai_scale` |

**Provision :** `.venv/bin/python scripts/provision-stripe-king-catalog.py` avec `STRIPE_SECRET_KEY` du compte `acct_1U1zzdEWku3DPVf3`.

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
| `STRIPE_SECRET_KEY` | **Mettre** `sk_test_…` puis `sk_live_…` du compte `acct_1U1zzdEWku3DPVf3` |
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
| 6 liens KING sur `acct_1U1zzdEWku3DPVf3` | **À provisionner** |
| Railway `/buy` → Stripe | **Après clé + catalog** |
| Webhook pipe | **À recréer** sur le nouveau compte |
| HubSpot leads | **GO** |
| www.blackwayconnect.com = Railway | **NO** (cutover CF) |
| `sk_*` réelle sur Railway | **À coller** depuis le nouveau compte |

**Cutover en cours** — ne plus partager les anciens `buy.stripe.com` du compte `…AG7HUL9Rtr`.

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
1. Coller `sk_test_…` (puis live) de `acct_1U1zzdEWku3DPVf3` → env + Railway
2. `python3 scripts/provision-stripe-king-catalog.py` → maj `payments.py`
3. Coller `STRIPE_WEBHOOK_SECRET` sur Railway + blackway-pipe
4. Tester `/buy/grow_hub_launch` en mode test
5. Copier produits test → live (Dashboard) ou re-run script en live
6. **Fermer** les autres comptes Stripe seulement après GO
7. Cutover `www.blackwayconnect.com` (token Cloudflare)
