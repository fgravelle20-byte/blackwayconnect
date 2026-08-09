# MASTER AUDIT Stripe — BlackWayConnect
Date: 2026-08-09  
Compte: `acct_1TDZjzAG7HUL9Rtr` — **BlackWayConnect Inc**

## Réponse honnête : « 100 % sûr ? »

**Non — personne ne peut promettre 100 %** tant que :
1. le même compte Stripe héberge aussi Vorixa / UNEXA / Factura / GetProforma,
2. Base44 peut encore créer des sous-comptes Connect avec ton iCloud,
3. le login Dashboard n’est pas vérifié manuellement sur `serviceclient@…`.

**Oui pour BlackWayConnect forfaits** : les 6 liens d’achat canoniques sont actifs, montants exacts, anciens liens BW désactivés, email business = `serviceclient@blackwayconnect.com`.

---

## 1) Compte principal

| Champ | Valeur | Statut |
|---|---|---|
| Account ID | `acct_1TDZjzAG7HUL9Rtr` | OK |
| Nom | BlackWayConnect Inc | OK |
| email compte | `serviceclient@blackwayconnect.com` | OK |
| support_email | `serviceclient@blackwayconnect.com` | OK |
| charges_enabled | true | OK |
| payouts_enabled | true | OK |
| Solde CAD | **-0,66 $** (frais taxe) | OK (pas de perte) |
| Charges réussies | **0** | Confirmé |
| Abonnements actifs | **0** | Confirmé |
| Personne KYC email | `accounting@unexa.ca` | ⚠ hors apps (KYC) |

**Verdict panique :** rien n’a été « effacé ». Il n’y avait pas 1 500 $ encaissés sur ce compte.

---

## 2) Forfaits BlackWayConnect (1 à 1)

| Forfait | Affiché | Stripe link | Montant réel | Actif | Aligné |
|---|---|---|---|---|---|
| Grow Hub Launch | 299 $/mois | buy…ZMeIw0J | **299,00** | oui | ✅ |
| Grow Hub Growth | 749 $/mois | buy…pceIw0I | **749,00** | oui | ✅ |
| Grow Hub Scale | 1 495 $/mois | buy…h4eIw0K | **1 495,00** | oui | ✅ |
| Site haute conversion | 1 995 $ | buy…04SeIw0M | **1 995,00** | oui | ✅ |
| Système de revenus | 4 995 $ | buy…BoeIw0L | **4 995,00** | oui | ✅ |
| App mobile / IA | 7 995 $ | buy…bNAeIw0N | **7 995,00** | oui | ✅ |

Anciens liens BW (129/299/599, spark/command/partner, etc.) : **tous inactive**.

---

## 3) Comptes Connect (sous-comptes)

| Compte | Email | charges | Statut |
|---|---|---|---|
| `acct_1Ti57RAGy4rgDDOf` Vorixa.ca | accounting@unexa.ca | false | ⚠ requirements past_due |
| `acct_1Ti56mAHP8NvtRDC` | null | false | ⚠ incomplete |
| `acct_1Ti56WPQoPA9z6RQ` | null | false | ⚠ incomplete |

+ **~42 fiches customer** avec `f.gravelle20@icloud.com` (Base44 tests) — **c’est la cause des emails « complète ton inscription » sur iCloud**.

---

## 4) Webhooks

| Endpoint | Status | Rôle |
|---|---|---|
| `api.blackwayconnect.com/webhooks/stripe` | **enabled** | ✅ CANONICAL BW |
| Emergent / ChatGPT stale | disabled | ✅ |
| `unexalogistics.com/...` | enabled | autre produit |
| `getproforma.app/...` | enabled | autre produit |
| `vorixa.base44.app/...` | enabled | ⚠ friction possible |
| Supabase stripe-sync | enabled | autre produit |

---

## 5) Facture ouverte

| Client | Produit | Montant | Status |
|---|---|---|---|
| HydroFix / Alex Brosseau | Vorixa Accélération | 113,83 $ CAD | **open / unpaid** |

---

## 6) Email UNIQUE

`serviceclient@blackwayconnect.com` — seule adresse apps/Stripe business.

Pour que la panique iCloud ne revienne **pas** :
1. Stripe Team login → uniquement `serviceclient@…`
2. Ne plus créer de comptes Base44/Connect avec l’iCloud
3. Idéal long terme : compte Stripe **séparé** pour BlackWay vs Vorixa/UNEXA/Factura

---

## Score confiance

| Zone | Confiance |
|---|---|
| Pas de ventes BW effacées | **100 %** (0 charges) |
| 6 forfaits BW montants corrects | **100 %** (vérifié live) |
| Email business compte | **100 %** (`serviceclient@`) |
| Plus jamais d’email iCloud | **~70 %** tant que Base44/Connect incomplets existent |
| Isolation multi-produits | **~50 %** (même compte Stripe partagé) |
