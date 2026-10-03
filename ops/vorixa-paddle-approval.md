# vorixa.ca — Paddle Website Approval (29 sept. 2026)

Rien n’a été reconstruit. Vorixa Base44 `6a2a047fbc1c05e8396f0ad2` et BlackWay restent séparés côté produits. Même vendeur Paddle (même `live_a4f8ad8f…` client token) : `blackwayconnect.com` est déjà **approuvé** ; `vorixa.ca` était **Unapproved**.

## Pourquoi ce n’était pas approuvé

1. **Le crawler Paddle n’exécute pas React.** Chaque URL (`/conditions-utilisation`, `/confidentialite`, `/remboursement-annulation`, `/pricing`) renvoyait le **même** `index.html` SPA (~27 ko, titre d’accueil). Paddle voyait « pas de CGU / confidentialité / remboursement ».
2. **Le ticket du 28 sept. était coincé.** Ritch (`sellers@paddle.com`) n’a pas pu lier `infoserviceclient@vorixa.ca` au compte. Personne n’avait répondu avec un Vendor ID. La signature Gmail disait « Vorixa LLC » — la société est **9495-5457 Quebec Inc**.

## Correctifs live (déployés)

Pages HTML **statiques distinctes** (crawler, sans JS) :

| Page | URL crawlable |
|------|----------------|
| Terms of Service | https://vorixa.ca/conditions-utilisation.html |
| Terms of Sale | https://vorixa.ca/conditions-vente.html |
| Privacy Notice | https://vorixa.ca/confidentialite.html |
| Refund (30 jours) | https://vorixa.ca/remboursement-annulation.html |
| Pricing SaaS CAD | https://vorixa.ca/pricing.html |
| Contact | https://vorixa.ca/contact.html |
| Checkout | https://vorixa.ca/activer |

Les chemins sans `.html` (`/conditions-utilisation`, etc.) font **301** vers le fichier statique. `/pricing` reste l’app React (grille Paddle) ; le crawler doit lire `/pricing.html`.

Réponse envoyée sur le fil Paddle `1a0e5ac5bc1fcf9d` (29 sept. 17:01 UTC), CC `f.gravelle20@icloud.com`.

## Ce que le propriétaire doit coller (Dashboard)

Paddle demande encore le **Vendor ID**. Ouvrir **https://vendors.paddle.com/** (compte déjà utilisé pour blackwayconnect.com) → coller l’ID compte dans le fil, **ou** ajouter `infoserviceclient@vorixa.ca` comme Team Member. Ne pas inventer un autre vendeur.

## Projets clients — déjà livrables, paiement bloqué par Paddle

Sites Vorixa **Publié** ; URL de livraison (JS) : `https://vorixa.ca/site/{sous_domaine}`.

Vérifié dans un vrai navigateur : https://vorixa.ca/site/electricite-dlp rend **Électricité DLP inc.** (Beauport, 418 663-8316), pas l’accueil Vorixa.

`electricite-dlp.vorixa.ca` : pas de DNS wildcard. `electricitedlp.com` / `lesprosdelaphoto.com` ne pointent pas encore vers Vorixa.

Encaissement : **https://vorixa.ca/activer** uniquement (Paddle). Pas de Stripe. HubSpot n’encaisse rien.

| Client | Statut projet | URL site |
|--------|---------------|----------|
| Électricité DLP | En production | https://vorixa.ca/site/electricite-dlp |
| L’Avenir Clinique Dentaire | En production | https://vorixa.ca/site/l-avenir-clinique-dentaire |
| Garage Jean-Noël Leblanc | Livraison | https://vorixa.ca/site/garage-jean-noel-leblanc |
| Johanne Beaudoin | Livraison | https://vorixa.ca/site/comptabilite-johanne-beaudoin |
| Pros de la Photo | Livraison | https://vorixa.ca/site/les-pros-photo |
| Maé Bonnet | Publié | https://vorixa.ca/site/mae-bonnet-photographe |
| Serge Pouliot | Publié | https://vorixa.ca/site/mecanique-serge-pouliot |
| Joseph Chartouny | Publié | https://vorixa.ca/site/joseph-chartouny-courtier-immobilier |
| Beauté Tout Pour Elle | Livré | (repo GitHub) |
| G. Martel | En production | maquette BlackWay `/maquettes/g-martel` |
