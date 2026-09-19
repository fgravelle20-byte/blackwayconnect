# Projets clients Vorixa — encaissement

> **AUDIT LIVE 19 sept. 2026** — preuve confirmée sur Stripe `acct_1TDZjzAG7HUL9Rtr` :  
> **26 factures `open` · 27 093,83 $ CAD dû · 0 $ payé · solde plateforme −0,66 $ CAD.**  
> Les 4 Payment Links Managed Payments restent **actifs**.  
> **Blocage virement Scotia :** Connect `acct_1Ti57RAGy4rgDDOf` (`9495-5457 Quebec Inc`) = `rejected.fraud` · `charges_enabled=false` · `payouts_enabled=false`.  
> Action obligatoire propriétaire : formulaire Stripe **supportability rejection appeal** (deadline ~19 sept. 2026).  
> Voir [`STATUS-LIVE.md`](./STATUS-LIVE.md). **Paddle n’est pas branché** dans ce dépôt — tout l’encaissement client est Stripe.

Snapshot catalogue du 13 sept. 2026, compte Stripe **Vorixa** `acct_1TDZjzAG7HUL9Rtr`.

**69 customers Stripe ≠ 69 clients qui vont payer.**  
43 sont des comptes internes / tests (surtout `f.gravelle20@icloud.com`).  
**26 projets** ont une facture ouverte, total **27 093,83 $ CAD**, **0 $ encaissé**.

Ce dépôt GitHub est public : les URL `invoice.stripe.com` (jetons de paiement) ne sont **pas** commitées. Copier un lien de facture depuis le Dashboard si besoin. Les Payment Links ci-dessous sont publics et **actifs**.

## Comment chaque client paie

Envoyer le `checkout_url` du projet (Payment Link + `client_reference_id`).  
Les liens du 31 août (`…Iw1E` … `Iw1H`) sont morts : Stripe refuse de les réactiver (`No valid payment method types`).  
Ils ont été **remplacés le 13 sept. 2026** par des Payment Links **Managed Payments** :

| Plan | CAD/mo | Lien actif |
|------|--------|------------|
| Départ | 499 | https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t |
| Croissance | 999 | https://buy.stripe.com/8x2aEW8211kLas67xkeIw2u |
| Personnalisé | 1500 | https://buy.stripe.com/9B63cudml1kLbwa18WeIw2v |
| Personnalisé | 3000 | https://buy.stripe.com/bJebJ05TT7J90Rw5pceIw2w |

23 projets n’ont **pas de courriel** sur le customer : SMS / WhatsApp / appel avec le `checkout_url`.

Les factures ouvertes restent valides en parallèle (Dashboard → Invoice → Copy link).

## Totaux

| Lot | Quantité | CAD |
|-----|----------|-----|
| Départ 499 | 10 | 4 990 |
| Croissance 999 | 10 | 9 990 |
| Personnalisé 1500 | 2 | 3 000 |
| Personnalisé 3000 | 3 | 9 000 |
| Facture unique (Hydrofix) | 1 | 113,83 |
| **À encaisser** | **26** | **27 093,83** |
| Exclus (interne) | 43 | 0 |

## Les 26 projets

| Code | Client | Courriel | CAD | Checkout |
|------|--------|----------|-----|----------|
| `VX-PRJ-01` | Alex Brosseau | piscinehydrofix@outlook.com | 113.83 | [facture Dashboard](https://dashboard.stripe.com/invoices/in_1ThhAAAG7HUL9RtrOVtBhCXy) |
| `VX-PRJ-02` | Photographie LeBouc | **courriel manquant** | 999 | [payer](https://buy.stripe.com/8x2aEW8211kLas67xkeIw2u?client_reference_id=cus_V9X1kuCbO9CEP9) |
| `VX-PRJ-03` | Garage André Vachon | **courriel manquant** | 499 | [payer](https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t?client_reference_id=cus_V9X2NgRzzI7PET) |
| `VX-PRJ-04` | Guillot Roger (1981) Inc | **courriel manquant** | 3000 | [payer](https://buy.stripe.com/bJebJ05TT7J90Rw5pceIw2w?client_reference_id=cus_V9X2OBi6wg5Zf6) |
| `VX-PRJ-05` | Électricité DLP Inc | **courriel manquant** | 3000 | [payer](https://buy.stripe.com/bJebJ05TT7J90Rw5pceIw2w?client_reference_id=cus_V9X2GmDVGtBXfq) |
| `VX-PRJ-06` | Mathieu Laliberté Courtier immobilier | **courriel manquant** | 3000 | [payer](https://buy.stripe.com/bJebJ05TT7J90Rw5pceIw2w?client_reference_id=cus_V9X2fiJumxkwAY) |
| `VX-PRJ-07` | Sénégalaise Coiffure | **courriel manquant** | 1500 | [payer](https://buy.stripe.com/9B63cudml1kLbwa18WeIw2v?client_reference_id=cus_V9X2EUKhvwx1GK) |
| `VX-PRJ-08` | PROTECH CONSTRUCTION 3093-3758 QUÉBEC INC. | info@protechconstruction.ca | 1500 | [payer](https://buy.stripe.com/9B63cudml1kLbwa18WeIw2v?client_reference_id=cus_V9X2dK9cBZ0Ldh) |
| `VX-PRJ-09` | Garage R. Latulippe Inc. | **courriel manquant** | 999 | [payer](https://buy.stripe.com/8x2aEW8211kLas67xkeIw2u?client_reference_id=cus_V9X2Hm6uliywtt) |
| `VX-PRJ-10` | Garage A.P. Roy | **courriel manquant** | 499 | [payer](https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t?client_reference_id=cus_V9X2js61ziFUdW) |
| `VX-PRJ-11` | Mécanique Serge Pouliot | **courriel manquant** | 499 | [payer](https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t?client_reference_id=cus_V9X29YJa6fTKqW) |
| `VX-PRJ-12` | Garage M.J. Automobile | **courriel manquant** | 499 | [payer](https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t?client_reference_id=cus_V9X2Z3PsCHBPYb) |
| `VX-PRJ-13` | Garage Paul Grégoire | **courriel manquant** | 999 | [payer](https://buy.stripe.com/8x2aEW8211kLas67xkeIw2u?client_reference_id=cus_V9X2DTlhyZSKlQ) |
| `VX-PRJ-14` | Garage Gaston Tremblay | **courriel manquant** | 499 | [payer](https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t?client_reference_id=cus_V9X2IH4cFIR5vM) |
| `VX-PRJ-15` | Mécanique J.C. & Fils | **courriel manquant** | 499 | [payer](https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t?client_reference_id=cus_V9X2I8XrZ0X8sz) |
| `VX-PRJ-16` | Garage S. Lemieux Inc. | **courriel manquant** | 999 | [payer](https://buy.stripe.com/8x2aEW8211kLas67xkeIw2u?client_reference_id=cus_V9X2xQn5xknL9l) |
| `VX-PRJ-17` | Garage D.L. (1998) Inc. | **courriel manquant** | 499 | [payer](https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t?client_reference_id=cus_V9X25vIXQiqxdI) |
| `VX-PRJ-18` | Garage M.B. Tremblay | **courriel manquant** | 999 | [payer](https://buy.stripe.com/8x2aEW8211kLas67xkeIw2u?client_reference_id=cus_V9X2dvpRHbIu5l) |
| `VX-PRJ-19` | Garage Pierre Boutin | **courriel manquant** | 499 | [payer](https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t?client_reference_id=cus_V9X2iazF2Ndv5B) |
| `VX-PRJ-20` | Mécanique Auto D G S Inc. | **courriel manquant** | 999 | [payer](https://buy.stripe.com/8x2aEW8211kLas67xkeIw2u?client_reference_id=cus_V9X3jylo0aovda) |
| `VX-PRJ-21` | Garage P. Michaud | **courriel manquant** | 999 | [payer](https://buy.stripe.com/8x2aEW8211kLas67xkeIw2u?client_reference_id=cus_V9X3XqqCVZPmyQ) |
| `VX-PRJ-22` | Photographe J. Lapalme | **courriel manquant** | 999 | [payer](https://buy.stripe.com/8x2aEW8211kLas67xkeIw2u?client_reference_id=cus_V9X3t8QUpXcF8U) |
| `VX-PRJ-23` | Atelier J.Fred | atelierjfred@gmail.com | 499 | [payer](https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t?client_reference_id=cus_V9X3yBibjjQnUK) |
| `VX-PRJ-24` | Le Boudoir A Fils | **courriel manquant** | 999 | [payer](https://buy.stripe.com/8x2aEW8211kLas67xkeIw2u?client_reference_id=cus_V9X3QZUXY3qXme) |
| `VX-PRJ-25` | Pascal Normand Artiste Photographe | **courriel manquant** | 499 | [payer](https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t?client_reference_id=cus_V9X3hQhNuBck5r) |
| `VX-PRJ-26` | Garage Gérald Pitre | **courriel manquant** | 999 | [payer](https://buy.stripe.com/8x2aEW8211kLas67xkeIw2u?client_reference_id=cus_V9X3P0jI1VxR71) |

Détail machine : `projets-a-encaisser.json`. Exclus : `exclus-internes.json`.

## Envoyer tout de suite (courriel déjà connu)

1. VX-PRJ-01 Alex Brosseau — facture 113,83 $ — `piscinehydrofix@outlook.com`
2. VX-PRJ-08 Protech — 1 500 $ — `info@protechconstruction.ca`
3. VX-PRJ-23 Atelier J.Fred — 499 $ — `atelierjfred@gmail.com`

## Hors des 69 customers (soumissions récentes)

| Code | Client | CAD/mo | Lien |
|------|--------|--------|------|
| VX-SOU-2026-6378 | Services Comptables Danielle Poulin | 198,00 | https://buy.stripe.com/3cIfZg5TT3sT57M2d0eIw2s |
| VX-SOU-2026-3480 | Services de Comptabilité Johanne Beaudoin | 423,70 | https://buy.stripe.com/9B69AS6XX8Nd43IbNAeIw2x |
| VX-SOU-2026-2055 | Garage Jean-Noël Leblanc | 377,15 | https://buy.stripe.com/eVqdR8dml7J90RwcREeIw2y |

## Pipe BlackWay

Un paiement Vorixa $499 ne doit **pas** ouvrir Grow Hub Growth. `pipe/vorixaManaged.js` ignore ces objets (`ignore: vorixa_service_gere`). L’activation Vorixa reste sur `vorixa.base44.app`.

Les 6 Payment Links Grow Hub du site (`plink_1UCmB*`) ont été réactivés le 13 sept. 2026.
