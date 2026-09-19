# Vorixa — statut encaissement (live)

Vérifié via Stripe MCP le **19 septembre 2026** sur le compte plateforme **Vorixa** `acct_1TDZjzAG7HUL9Rtr` (livemode).

## Preuve : l’argent n’est pas rentré

| Métrique | Valeur live |
|----------|-------------|
| Factures `open` | **26** |
| Montant dû | **27 093,83 CAD** |
| Montant payé (ces 26) | **0 CAD** |
| Factures `paid` récentes (recherche) | **0** |
| Solde plateforme `available` | **−0,66 CAD** (−66 ¢) |

Les Payment Links catalogue (Départ / Croissance / Personnalisé 1500 / 3000) sont toujours **`active: true`** avec Managed Payments.

## Pourquoi le virement Scotia est bloqué

Compte Connect **9495-5457 Quebec Inc** `acct_1Ti57RAGy4rgDDOf` :

| Champ | Valeur |
|-------|--------|
| `disabled_reason` | **`rejected.fraud`** |
| `charges_enabled` | `false` |
| `payouts_enabled` | `false` |
| Capabilities | `card_payments` + `transfers` = **inactive** |
| Banque liée | Bank of Nova Scotia `····3617` |
| Exigence ouverte | `interv_…supportability_rejection_appeal.form` |
| Deadline exigence | ~19 sept. 2026 (epoch `1789221696`) |

Deux autres Connect sous la même plateforme sont aussi `rejected.fraud`.

Les factures clients encaissent sur le **compte plateforme**. Tant que l’appel fraude Connect n’est pas levé, un virement Scotia via ce Connect **reste impossible**.

### Action propriétaire (hors GitHub)

1. Ouvrir le Dashboard Stripe → Connect → compte `9495-5457 Quebec Inc`.
2. Remplir le formulaire **Supportability rejection appeal**.
3. Attendre la réactivation `charges_enabled` / `payouts_enabled`.

Un merge GitHub **ne peut pas** lever un `rejected.fraud` Stripe.

## Paddle — site approval (photo Dashboard)

Paddle exige que le site **lie ou contienne** :

1. Terms of Service → `https://vorixa.ca/conditions-utilisation`
2. Privacy Notice → `https://vorixa.ca/confidentialite`
3. Refund Policy → `https://vorixa.ca/remboursement-annulation`

Ces trois liens sont maintenant dans le footer Vorixa (`LEGAL_SHORT`).

Dans le champ domaine Paddle, entrer **seulement** :

```
vorixa.ca
```

Pas `https://`, pas `www.`, pas de chemin de page. Les sous-domaines doivent être soumis séparément.


## Encaisser **maintenant** (côté clients — Stripe)

Les clients n’ont pas payé : il faut **envoyer** les liens.

### Courriel déjà connu (envoyer tout de suite)

| Code | Client | CAD | Lien |
|------|--------|-----|------|
| VX-PRJ-01 | Alex Brosseau | 113,83 | Dashboard invoice `in_1ThhAAAG7HUL9RtrOVtBhCXy` → Copy payment link |
| VX-PRJ-08 | Protech Construction | 1 500 | https://buy.stripe.com/9B63cudml1kLbwa18WeIw2v?client_reference_id=cus_V9X2dK9cBZ0Ldh |
| VX-PRJ-23 | Atelier J.Fred | 499 | https://buy.stripe.com/7sY14meqp1kL2ZE5pceIw2t?client_reference_id=cus_V9X3yBibjjQnUK |

### 23 autres

Pas de courriel sur le customer Stripe → SMS / WhatsApp / appel avec le `checkout_url` du tableau dans `README.md`.

## Fichiers liés

- `README.md` — tableau des 26 + totaux
- `projets-a-encaisser.json` — détail machine
- `exclus-internes.json` — 43 comptes à ne pas facturer
- PR historique : [#18](https://github.com/fgravelle20-byte/blackwayconnect/pull/18) (liens Managed Payments + garde pipe Vorixa)
