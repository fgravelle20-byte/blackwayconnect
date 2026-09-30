# Vorixa — statut encaissement (live)

Mis à jour **29 septembre 2026**.

## HubSpot n’est pas la caisse

HubSpot n’a **rien encaissé**. Ce n’est pas un processeur de paiement. Ça ne débloque pas le portail. Ça ne doit pas entrer dans le parcours Paddle.

| Surface | Rôle |
|---------|------|
| HubSpot | CRM optionnel (contacts). **0 $.** |
| RevenueCat | Ouvertures d’app. **0 $ MRR.** |
| Stripe Connect `acct_1Tjpl2AxE1vBkTdr` (MCP) | `rejected.fraud` — **ne pas facturer ici.** |
| Anciennes factures Stripe Vorixa `acct_1TDZjzAG7HUL9Rtr` | 26 factures historiques. **Remplacées par Paddle.** Ne plus envoyer `buy.stripe.com`. |
| **Caisse Vorixa** | **Paddle** sur `https://vorixa.ca/activer` |
| **Caisse BlackWay** | **Paddle** sur `https://blackwayconnect.com/payer` — ne pas mélanger. |

## Plateforme Vorixa en opération

| Composant | Statut |
|-----------|--------|
| App Base44 `6a2a047fbc1c05e8396f0ad2` | Publiée `https://vorixa.base44.app` |
| Domaine `vorixa.ca` | Vérifié, live |
| `/activer` | PaymentOffer · Paddle MoR |
| Prix SaaS live | Présence 149 / Croissance 299 / Domination 599 CAD/mois (`paddle-pricing-config` production) |
| Approval site Paddle `vorixa.ca` | En revue — Paddle a demandé le **Vendor ID** (28 sept.). Répondre depuis le Dashboard Vorixa, **pas** avec le compte BlackWay. |

## Projets clients — opération (29 sept.)

Mis en CRM Vorixa + relance Paddle (sans Stripe) :

| Client | Courriel | Projet | Paiement |
|--------|----------|--------|----------|
| PROTECH Construction | info@protechconstruction.ca | En production | `https://vorixa.ca/activer` |
| Atelier J.Fred | atelierjfred@gmail.com | En production | `https://vorixa.ca/activer` |
| Piscines HydroFix | piscinehydrofix@outlook.com | En production | `https://vorixa.ca/activer` |
| G. Martel | guillaume@gmartel.ca | Maquette → production | `https://vorixa.ca/activer` |
| Électricité DLP | mjpaquet@electricitedlp.com | En production (structure livrée) | `https://vorixa.ca/activer` |
| Beauté Tout Pour Elle | contact@beautetoutpourelle.ca | Livraison | `https://vorixa.ca/activer` |
| L’Avenir Clinique Dentaire | info@cliniqueavenir.com | Démo prête | `https://vorixa.ca/activer` |
| Pascal Normand | info@pascalnormand.com | Relance | `https://vorixa.ca/activer` |
| Mathieu Laliberté | m.laliberte@kw.com | Relance | `https://vorixa.ca/activer` |
| Garage A.P. Roy | garageparoy@xplornet.com | Relance | `https://vorixa.ca/activer` |

Sites Vorixa déjà publiés (sous-domaine) : DLP, Jean-Noël Leblanc, Pros de la Photo, Johanne Beaudoin, Maé Bonnet, Serge Pouliot, Joseph Chartouny, L’Avenir. **Pas d’encaissement tant que Paddle n’est pas payé.**

## Bloqué hors GitHub (propriétaire)

1. Paddle Website Approval `vorixa.ca` : coller le **Vendor ID Vorixa** dans le fil `sellers@paddle.com` (pas le Vendor ID BlackWay).
2. Stripe `rejected.fraud` : appel Dashboard — GitHub ne peut pas le lever. Inutile pour l’encaissement Paddle.
3. 23 dossiers garage/photo **sans courriel** : SMS / appel (voir téléphones dans `COURRIELS-PRETS.md`) avec `https://vorixa.ca/activer` uniquement.

## Ne pas faire

- Envoyer `buy.stripe.com` (contredit le courriel Protech du 26 sept. « sans Stripe »).
- Mélanger Paddle Vorixa et Paddle BlackWay.
- Compter HubSpot « paiement reçu » comme de l’argent.
