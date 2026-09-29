# RETIRÉ — Pack Cellulaire Stripe

Stripe n'est plus un canal de paiement pour les nouvelles ventes BlackWayConnect.

## Règle active

- Processeur de nouveaux paiements : **Paddle**
- Ne créer aucun nouveau Payment Link Stripe.
- Ne remettre aucune URL `buy.stripe.com` dans le site, l'app mobile, les courriels ou les outils.
- Les offres Cellulaire restent **sur demande** tant que des prix Paddle dédiés et approuvés ne sont pas ajoutés.
- Le Portail et les webhooks Stripe existants peuvent rester pour l'historique, remboursements et rapprochement des anciennes transactions.

Voir :
- `src/cellulaireConfig.ts`
- `src/paddleCatalog.ts`
- `ops/payment-lock/LOCKED.json`
