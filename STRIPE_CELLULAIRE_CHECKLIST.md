# Pack Cellulaire — statut paiement

**État actuel : Paddle LIVE. Stripe checkout RETIRÉ.**

Les quatre forfaits sont vendus exclusivement par le checkout canonique BlackWayConnect :

- `cell_signal` — 79 CAD/mois → `/payer?plan=cell_signal`
- `cell_route` — 199 CAD/mois → `/payer?plan=cell_route`
- `cell_fleet` — 399 CAD/mois → `/payer?plan=cell_fleet`
- `cell_command` — 799 CAD/mois → `/payer?plan=cell_command`

Facturation : **immédiate**. Aucun essai gratuit.

## Stripe

- Aucun nouveau Payment Link Stripe.
- Aucun CTA public ou mobile ne doit émettre une URL de checkout Stripe.
- Les anciens IDs Stripe restent uniquement dans le pipe pour résoudre les événements historiques.
- Le webhook Stripe peut rester actif pour rapprochement/remboursement des transactions historiques.
- Toute ancienne URL BlackWay d’achat (`/checkout`, `/stripe`, `/paiement-stripe`, etc.) doit rediriger vers `/payer` Paddle.
