# BACKLOG — Pack Cellulaire Stripe (NE PAS FAIRE MAINTENANT)

**Priorité actuelle = déployer l’app Apple** → `base44/APPLE_TESTFLIGHT_CHECKLIST.md`.  
Revenir ici seulement après TestFlight / App Store utiles.

---

# Stripe — Pack Cellulaire (revenu #2)

Créer **4 Payment Links** (CAD / mois, récurrents) dans Stripe Dashboard → Payment Links.

Success URL (tous) :
`https://blackwayconnect.com/portail?session_id={CHECKOUT_SESSION_ID}`

| Key | Nom | Prix | Metadata produit / link |
|-----|-----|------|-------------------------|
| cell_signal | Cell Signal | 79 | `bw_forfait=cell_signal` |
| cell_route | Cell Route | 199 | `bw_forfait=cell_route` |
| cell_fleet | Cell Fleet ★ | 399 | `bw_forfait=cell_fleet` |
| cell_command | Cell Command | 799 | `bw_forfait=cell_command` |

Après création, coller les URLs `https://buy.stripe.com/...` dans :
1. `src/cellulaireConfig.ts` → `paymentLink` de chaque plan
2. `worker/index.ts` → `CELLULAIRE_CHECKOUT`

Puis `npm run deploy`.

Webhook déjà : `https://api.blackwayconnect.com/webhooks/stripe`
