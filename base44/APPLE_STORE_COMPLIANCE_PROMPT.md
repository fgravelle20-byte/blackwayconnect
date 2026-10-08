# Colle ce prompt ENTIER dans le chat IA Base44 Builder (AVANT génération IPA)

Tu prépares **Black Way Link / BlackWayConnect** pour **TestFlight + App Store**. Priorité = app utile en production. **Aucun checkout Stripe.** Les ventes passent par le site BlackWayConnect et Paddle.

## Produit verrouillé (obéir)

1. **Dashboard mobile = Portail Client Master**  
   URL : `https://blackwayconnect.com/portail`  
   Pitch : « Contrôle ton dashboard partout sur mobile. Inclus avec Grow Hub. »
2. **Revenu #1** = Grow Hub **web** `https://blackwayconnect.com/forfaits` (Paddle live via `/payer`).
3. **Pack Cellulaire** = Paddle live sur le site. Si exposé dans l’app, ouvrir le site en navigateur externe.
4. Cette app native est une **télécommande du Portail** + outils + leads — **pas** un 2ᵉ store d’abos digitaux.

## Apple / conformité paiements (CRITIQUE)

Ne pas embarquer de checkout de paiement dans la WebView native; le parcours payant reste sur le site BlackWayConnect.

- **Interdit dans la WebView native :** checkout Stripe ou lien de paiement externe non canonique.
- **Autorisé :** CTA « Voir les forfaits » / « S’abonner » qui ouvre le **site** en navigateur externe (Safari) :
  `https://blackwayconnect.com/forfaits?utm_source=grow_hub_app&utm_medium=app_store&utm_campaign=external_checkout&bw_source=mobile_app&bw_ref=base44_app`
- Leads HubSpot via function `submit-lead` + secret `BW_LEAD_KEY` = OK.
- Deep links outils site = OK.

## Écrans à aligner MAINTENANT

### Home
- Brand **BlackWayConnect** hero-level, rouge `#e10600` sur noir.
- Headline FR : « Contrôle ton dashboard. Partout. »
- CTA **primaire** : « Ouvrir mon Portail » → `https://blackwayconnect.com/portail` (garder UTM `bw_source=mobile_app`, `bw_ref=base44_app`).
- CTA secondaire : « Outils » → `https://blackwayconnect.com/outils` ou onglet Outils.
- CTA tertiaire (externe Safari) : « Forfaits Grow Hub (site) » → `/forfaits` comme ci-dessus.
- Enlever / masquer toute grille de paiement embarquée; les CTAs payants ouvrent le site BlackWayConnect.

### Pipeline / Outils / Lead
- Garder pipeline local + lead `source=app_mobile` si déjà là.
- Outils = deep links site seulement.

### Ancien onglet « Forfaits »
- Renommer ou convertir en **« Pack terrain (bientôt) »** info-only, **sans** boutons Stripe.
- Ou rediriger uniquement vers Portail + lien externe Safari `/forfaits`.
- Ne transforme pas `plansCellulaire` en checkout natif; les URLs Paddle ouvrent le site externe.

### Privacy / Terms (obligatoire Apple)
- Liens visibles sur Home / Plus **avant** login :
  - Confidentialité : `https://blackwayconnect.com/confidentialite`
  - Conditions : page Terms Base44 existante **ou** créer une page courte pointant vers le site.
- Support : `serviceclient@blackwayconnect.com`

### Manifest / branding store
- Nom : BlackWayConnect
- Sous-titre mental : Portail Client mobile / Grow Hub dashboard
- Pas « social networking ». Pas faux compteurs.

## Backend (ne pas casser)
- Bootstrap public OK : `GET https://blackwayconnect.com/api/mobile/bootstrap`
- Utiliser bootstrap pour URLs site / QR — **pas** pour enchaîner des Payment Links digitaux in-app.
- Secret `BW_LEAD_KEY` Dashboard → Secrets seulement (jamais dans le frontend).

## Publish
Publie l’app pour que `https://black-way-link.base44.app/` serve cette UI conforme.

## Ne pas faire
- Ne pas créer / coller de liens Stripe; utiliser uniquement les URLs Paddle du bootstrap
- Ne pas hardcoder `BW_LEAD_KEY`
- Ne pas inventer d’URL App Store / Play
- Ne pas inventer de faux likes / faux MRR
- Ne pas vendre Spark→Partner via Stripe; le site externe utilise Paddle
- Ne pas faire de CRUD admin gris

## Done when
- [ ] CTA #1 = Portail
- [ ] Zéro checkout Stripe; paiements via site externe Paddle
- [ ] Grow Hub payant = Safari / site seulement
- [ ] Privacy + support visibles
- [ ] Publié sur black-way-link.base44.app
- [ ] Prêt pour scan **Mobile app** → Create App Store files
