# AUDIT COMPLET — Apps Stripe + plateformes
Date: **2026-08-09**  
Compte: [`acct_1TDZjzAG7HUL9Rtr`](https://dashboard.stripe.com/acct_1TDZjzAG7HUL9Rtr) — **BlackWayConnect Inc** (CA / CAD)

## Verdict en 1 phrase

**Stripe (compte + liens d’achat BW) fonctionne. Les plateformes ne sont PAS 100 % live** — domaine Cloudflare bloqué, Railway pas à jour, webhook canonique cassé (corrigé), autres apps partagées / down.

---

## 1) Compte Stripe (API live)

| Check | Résultat |
|---|---|
| charges_enabled / payouts_enabled | **true / true** |
| email / support | `serviceclient@blackwayconnect.com` |
| Pays / devise | **CA / CAD** |
| Charges réussies | **0** |
| Abonnements actifs | **0** |
| Litiges | **0** |
| Balance | **-0,66 CAD** (frais taxe Stripe seulement) |
| Transactions balance | 1 fee taxe — **aucun encaissement** |

→ Ce n’est **pas** un vol / wipe Stripe. Il n’y a simplement **pas de ventes encaissées** sur ce compte.

---

## 2) « Applications » sur ce compte Stripe

Ce n’est **pas** une Stripe App Marketplace. C’est **un seul compte live** partagé par plusieurs produits :

| App / plateforme | Produits Stripe | Payment Links actifs | Webhook | Site live ? |
|---|---|---|---|---|
| **BlackWayConnect** | Grow Hub + activations | **6 canonical OK** | pipe (corrigé) | Railway OK ; **apex CF 403** |
| **Vorixa** | Croissance / Accélération / Domination + Starter/Pro | 6+ liens | `vorixa.base44.app` enabled | **503** Base44 / `app.vorixa.ca` down |
| **Factura** | Solo/Pro/Enterprise + Basic/Pro/Enterprise | 3+ liens | (via compte) | **200** factura.app |
| **GetProforma** | Autonome / Croissance / Équipe | liens | `getproforma.app` enabled | **« isn't live yet » 404** |
| **UNEXA** | Starter / Pro / Business / Enterprise | produits | `unexalogistics.com` enabled | **« isn't live yet » 404** |
| **AlphaVIT / LoadFlows / Momentum** | produits orphelins | liens divers | — | hors BW |
| **Supabase stripe-sync** | — | — | enabled | sync externe |

**Stripe Apps (`stripe apps upload`)** : aucun `stripe-app.json` dans le repo BW. Le message « bac à sable » n’a **aucun lien** avec les ventes BW.

---

## 3) BlackWayConnect — forfaits Stripe (OK)

| Forfait | Montant | Payment Link | HTTP |
|---|---|---|---|
| Grow Hub Launch | **299 CAD/mois** | buy…ZMeIw0J | 200 |
| Grow Hub Growth | **749 CAD/mois** | buy…pceIw0I | 200 |
| Grow Hub Scale | **1495 CAD/mois** | buy…h4eIw0K | 200 |
| Site haute conversion | **1995 CAD** | buy…04SeIw0M | 200 |
| Système de revenus | **4995 CAD** | buy…BoeIw0L | 200 |
| App mobile / AI Scale | **7995 CAD** | buy…bNAeIw0N | 200 |

Les 6 liens **encaissent correctement** si on les ouvre directement (Checkout Stripe live).

---

## 4) Plateforme BlackWay — ce qui casse vraiment

| Composant | Statut | Impact |
|---|---|---|
| Railway `…railway.app` homepage | **200** / health `2.0.1` old | Site marketing OK sur URL Railway |
| `/api/v1/payments/plans` | **200** mais **sans** `payment_link` / `buyable` | Ancien deploy |
| `/api/v1/payments/buy/{plan}` | **404** | Boutons Acheter code **pas déployés** |
| `/api/v1/payments/status` | **404** | Audit endpoint pas live |
| `/api/v1/payments/webhook` Railway | **joignable** (sig invalid = OK) | Backup possible |
| `blackwayconnect.com` | **403 CF challenge** | Apex **pas** le site Railway |
| `api.blackwayconnect.com/webhooks/stripe` | **403 CF challenge** | Stripe **ne peut pas** livrer les events |
| `blackway-pipe` health | ok ; **`stripe_secret_key: false`** | HubSpot lead OK ; claim portal limité |
| Webhook Stripe → pipe | **corrigé 2026-08-09** | URL pointée vers worker joignable |

### Correctif webhook appliqué
- Avant : `https://api.blackwayconnect.com/webhooks/stripe` (CF bloque → Stripe fail)
- Après : `https://blackway-pipe.f-gravelle20.workers.dev/webhooks/stripe` (HTTP 400 sig invalide = endpoint vivant)

---

## 5) Autres plateformes (pas 100 %)

| URL | Résultat |
|---|---|
| factura.app | **UP** |
| vorixa.base44.app | **503** |
| app.vorixa.ca | **down** |
| getproforma.app | **404 not live** |
| unexalogistics.com | **404 not live** |
| Invoice ouverte HydroFix / Vorixa | **113,83 CAD unpaid** |

Connect sous-comptes : 3 comptes CA incomplets (`charges_enabled: false`), dont Vorixa.ca past_due.

---

## 6) Est-ce « 100 % fonctionnel selon Stripe » ?

| Couche | 100 % ? |
|---|---|
| Compte Stripe peut charger | **Oui** |
| Liens d’achat BW montants exacts | **Oui** |
| Encaissements / clients payants | **N/A — 0 vente** |
| Site public blackwayconnect.com → checkout | **Non** (CF + vieux Railway) |
| Webhook post-paiement → HubSpot | **Réparé** (pipe) ; à retester après 1 vrai paiement test |
| Toutes les apps du compte | **Non** (Vorixa/GetProforma/UNEXA down ou partagés) |

**Promesse 100 % globale = impossible** tant que 1 seul compte Stripe mélange 5+ produits et que le DNS/CF n’est pas coupé vers Railway.

---

## 7) Actions concrètes (ordre)

1. **Merge + deploy Railway** de la branche `cursor/stripe-plumbing-lock-381b` → active `/buy/{plan}` + `/status`.
2. **Cloudflare Option B** : Worker proxy → Railway ; retirer challenge sur webhook / apex ; ou garder webhook sur `workers.dev`.
3. Remettre `STRIPE_SECRET_KEY` sur `blackway-pipe` si portal claim nécessaire.
4. Séparer plus tard : 1 compte Stripe **par** produit (BW / Vorixa / Factura…).
5. Ignorer `stripe apps upload` / sandbox sauf si tu développes une vraie Stripe App.

---

## Preuves API (résumé)

- Account: BlackWayConnect Inc, CA, charges/payouts enabled  
- Payment links BW: 6 active, montants vérifiés via line_items  
- Charges: 0 · Subscriptions: 0 · Disputes: 0 · Balance: -66 cents CAD  
- Webhooks enabled: pipe BW, UNEXA, GetProforma, Vorixa Base44, Supabase  
- Webhooks disabled: Emergent / ChatGPT stale + vieux Vorixa app.base44.com  
