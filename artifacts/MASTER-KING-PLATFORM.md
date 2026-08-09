# BLACKWAYCONNECT — MASTER KING PLATFORM
**Date:** 2026-08-09  
**Règle:** Il n’existe **qu’UNE** plateforme BlackWay. Tout le reste = FAUX / MORT / IGNORER.

---

## 1) LA SEULE SOURCE DE VÉRITÉ

| Rôle | URL / ID | Statut |
|---|---|---|
| **Compte Stripe** | `acct_1TDZjzAG7HUL9Rtr` | LIVE |
| **Code repo** | GitHub `fgravelle20-byte/blackwayconnect` branche à merger : `cursor/stripe-plumbing-lock-381b` (PR #13) | KING |
| **Site / API prod** | `https://blackwayconnect-production.up.railway.app` | KING (deploy) |
| **Domaine public** | `https://blackwayconnect.com` | KING **après** cutover CF → Railway |
| **Webhook paiements** | `https://blackway-pipe.f-gravelle20.workers.dev/webhooks/stripe` | KING |
| **Leads HubSpot** | `https://blackway-pipe.f-gravelle20.workers.dev/lead` | KING |
| **Email unique** | `serviceclient@blackwayconnect.com` | KING |

### 6 forfaits KING (seuls liens d’achat autorisés)

| Forfait | Prix | Lien |
|---|---|---|
| Grow Hub Launch | 299 $/mois | https://buy.stripe.com/4gM8wO8216F52ZEeZMeIw0J |
| Grow Hub Growth | 749 $/mois | https://buy.stripe.com/eVq9AScihfbBbwa5pceIw0I |
| Grow Hub Scale | 1 495 $/mois | https://buy.stripe.com/bJedR81DD8Nd57M3h4eIw0K |
| Site haute conversion | 1 995 $ | https://buy.stripe.com/7sY28qgyx5B10Rw04SeIw0M |
| Système de revenus | 4 995 $ | https://buy.stripe.com/eVq6oGdmld3tcAe8BoeIw0L |
| App mobile / IA | 7 995 $ | https://buy.stripe.com/00w9AS4PPbZpdEibNAeIw0N |

---

## 2) FAUX BLACKWAY — ÉLIMINÉS / À IGNORER

### Sites / déploiements FAUX (ne plus ouvrir, ne plus vendre dessus)

| Surface | Pourquoi FAUX | Action |
|---|---|---|
| `blackwayconnect.info288793.chatgpt.site` | Ancien ChatGPT Sites, **prix 129/599** | **IGNORER** — couper DNS |
| `custom-domains.chatgpt.site` | Domaine ChatGPT cassé | **IGNORER** |
| `blackway-connect.preview.emergentagent.com` | Preview Emergent | **IGNORER** — webhook déjà disabled |
| `subscription-hub-326.preview.emergentagent.com` | Preview Emergent billing | **IGNORER** — webhook déjà disabled |
| `api.blackwayconnect.com` (actuel) | Cloudflare challenge 403 | **Ne pas utiliser** pour webhooks |
| `webhooks.blackwayconnect.com` | N’existe pas / DNS vide | **IGNORER** |
| `www` → ChatGPT (historique) | Ancien branchement | Remplacer par Worker → Railway |

### Dossiers repo = LEGACY (pas le site KING)

| Dossier | Rôle | Action |
|---|---|---|
| `services/blackway-engine/` | Ancien moteur Node / scripts | **LEGACY** — ne pas déployer comme site |
| `services/bw-stripe-webhook/` | Ancien worker webhook | **LEGACY** — remplacé par `blackway-pipe` |
| `src/index.js` + `wrangler.toml` | Worker CF Option B (proxy → Railway) | **GARDER** pour cutover domaine |
| `main_minimal.py` | Stub | **IGNORER** |
| `artifacts/` anciens CSV / audits | Historique | Lecture seule |

### Payment Links BW FAUX

**Déjà tous `active=false`** (spark/command/partner, launch_pricing, vieux Grow Hub, anciens forfaits site/CRM/IA).  
Ne jamais les réactiver. Seuls les 6 liens `canonical=true` ci-dessus.

### Branches / PRs = bruit (ne pas confondre avec KING)

| Branche / PR | Statut |
|---|---|
| **PR #13** `cursor/stripe-plumbing-lock-381b` | **KING à merger + deploy Railway** |
| PR #11 go-live Cloudflare | Utile pour DNS — après #13 |
| PR #10 buy buttons | Fusionné conceptuellement dans #13 |
| PR #12 hero | Cosmétique — pas prioritaire |
| sandbox/* | **FAUX** — ignore |

---

## 3) POURQUOI TU TE SENS « COUPÉ »

1. **Plusieurs BlackWay vivants en même temps** (ChatGPT + Emergent + Railway + Cloudflare).
2. Le domaine public **n’affiche pas** encore le KING Railway (CF challenge / ancien site).
3. Railway prod tourne encore un **vieux build** sans `/buy/{plan}` → impression que Stripe est cassé.
4. **0 vente encaissée** sur Stripe (pas un vol) — les « premiers revenus » n’étaient pas sur ce compte live.

Ce n’est pas Stripe qui t’a coupé. C’est le **multi-déploiement**.

---

## 4) PLAN KING (ordre strict)

1. **Merger PR #13** → deploy Railway  
2. Vérifier :  
   - `…railway.app/api/v1/payments/buy/grow_hub_launch` → redirect Stripe 299 $  
   - `…railway.app/health`  
3. **Cloudflare cutover** : Worker `src/index.js` sur apex+www → Railway (Option B)  
4. **Ne plus toucher** ChatGPT Sites / Emergent  
5. Vendre **uniquement** via les 6 liens KING (ou boutons `/buy/` après deploy)

---

## 5) TEST « C’EST LE KING ? »

Si ce n’est **pas** dans le tableau §1 → **ce n’est pas BlackWay**. Ferme l’onglet.

Checklist mentale :
- [ ] URL Railway ou blackwayconnect.com (après cutover)
- [ ] Prix 299 / 749 / 1495 / 1995 / 4995 / 7995
- [ ] Email `serviceclient@blackwayconnect.com`
- [ ] Lien buy.stripe.com se terminant par `…Iw0I` à `…Iw0N` (les 6 KING)
