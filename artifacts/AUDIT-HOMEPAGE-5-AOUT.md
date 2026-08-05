# Audit page d'accueil — correctifs appliqués (5 août 2026)

## Dans ce dépôt (FastAPI / templates)

- Grille Grow Hub : **299 $ · 749 $ · 1 495 $** (+ Entreprise sur mesure)
- Section projets : 1 995 $ · 4 995 $ · 7 995 $
- Formats FR : `184 k$`, `+18 %`, `4 995 $` (plus de `$184K` / `25 K$+`)
- CTA dominants : **Réserver 15 minutes** + **Voir les prix**
- Preuve sociale HydroFix, FAQ + JSON-LD, garantie 30 jours, frais 0 $, annulation
- Pied de page légal : « 9495-5457 Québec inc., faisant affaire sous BlackWayConnect »
- NEQ / TPS affichés
- Sélecteur CAD / USD (taux 0,766)
- Middleware 301 `www` → apex (si le trafic www arrive sur cette app)
- Services catalogues Node (`services/`) + artefacts HubSpot mis à jour

## Action manuelle hébergeur (critique)

Le site marketing LIVE (`blackwayconnect.com`) est actuellement servi par **Vinext**, pas par ce dépôt Railway Python.

1. **www** : ajouter le domaine personnalisé `www.blackwayconnect.com` chez l’hébergeur Vinext/Cloudflare et rediriger vers `https://blackwayconnect.com` (aujourd’hui : 404).
2. **Recoller les mêmes textes** sur le front Vinext (ou pointer le domaine vers ce service une fois validé).
3. **Stripe** : créer de nouveaux Price objects aux montants corrigés (les `price_id` historiques restent pour reconnaître les anciens paiements).
4. **HubSpot** : régénérer le jeton Private App et le coller dans Cloudflare Worker `blackway-pipe` (`HUBSPOT_TOKEN`).
5. **HydroFix** : faire approuver le témoignage + obtenir soumissions/mois avant/après.

## Vérification FR — chaînes interdites

Après déploiement, aucune de ces chaînes ne doit apparaître sur les pages FR :

`$1` (préfixe dollar anglo) · `K$` · `%` sans espace · `129 $` · `599 $`
