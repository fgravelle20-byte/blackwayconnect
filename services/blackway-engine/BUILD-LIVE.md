# BlackWay Lead Engine — Rapport de build LIVE

Build exécuté le 2 août 2026. Tous les objets ci-dessous existent réellement.

---

## 1. Stripe — compte `acct_1TDZjzAG7HUL9Rtr` (mode LIVE)

Grille tarifaire tirée de https://blackwayconnect.com/forfaits

### Forfaits d'activation (paiement unique)

| Forfait | Prix | Produit | Prix (price ID) | Lien de paiement |
|---|---:|---|---|---|
| Website & Lead Launch | 1 495 $ CAD | `prod_V0Cv1dDC5eC0C9` | `price_1U0CWRAG7HUL9RtrKszbmNvn` | https://buy.stripe.com/fZu9AS2HH3sT2ZEdVIeIw0q |
| Revenue System | 4 995 $ CAD | `prod_V0CvPLTwUMUkf5` | `price_1U0CWYAG7HUL9RtrqiOYoSVL` | https://buy.stripe.com/14A7sKeqpfbB8jY5pceIw0r |
| AI Scale | 7 995 $ CAD | `prod_V0CvaVl6B0EDYB` | `price_1U0CWYAG7HUL9RtrEHxzww0T` | https://buy.stripe.com/dRm8wO965fbB8jY5pceIw0s |

### Grow Hub (abonnements mensuels récurrents)

| Abonnement | Prix | Produit | Prix (price ID) | Lien d'abonnement |
|---|---:|---|---|---|
| Grow Hub Launch | 129 $/mois CAD | `prod_V0Cw4lDSQG8ni9` | `price_1U0CWiAG7HUL9RtrKaR00BRz` | https://buy.stripe.com/6oUfZgbedgfFgQu2d0eIw0t |
| Grow Hub Growth | 299 $/mois CAD | `prod_V0CwXaZSeLKWuy` | `price_1U0CWhAG7HUL9RtrRUDlmp9v` | https://buy.stripe.com/28EeVc1DDd3tbwag3QeIw0u |
| Grow Hub Scale | 599 $/mois CAD | `prod_V0CwXQVCdNCNIO` | `price_1U0CWqAG7HUL9RtrwZ66aT90` | https://buy.stripe.com/6oUfZg0zz6F57fU3h4eIw0v |

Chaque produit, prix et lien porte la métadonnée `bw_forfait`, `bw_type`
(`activation` / `abonnement`) et `plateforme=blackwayconnect`. Les liens
collectent l'adresse de facturation et le téléphone, et acceptent les codes
promo — c'est ce qui alimente automatiquement le lead HubSpot.

**Reste à faire manuellement (1 minute) :** créer le webhook Stripe vers
`https://<domaine>/webhook/stripe` avec les événements
`checkout.session.completed`, `payment_intent.succeeded`, `invoice.paid`,
`customer.subscription.created`, puis coller le secret dans
`STRIPE_WEBHOOK_SECRET`. Le endpoint est déjà codé dans
`src/routes/stripe.js`.

---

## 2. Google Forms — formulaire de qualification

- **Titre :** BlackWayConnect — Demande de soumission
- **Form ID :** `1Ghw9J2WC4O4IGYRfkB7JkdF7Jb1DCmm6M7Ijp_TS7jw`
- **Lien public :** https://docs.google.com/forms/d/e/1FAIpQLSeB_glVi0Hsk8Pge3Id8qHa_AZdxFaT0p19tE48_Re_l5hdCA/viewform
- **Édition :** https://docs.google.com/forms/d/1Ghw9J2WC4O4IGYRfkB7JkdF7Jb1DCmm6M7Ijp_TS7jw/edit

9 questions, dans l'ordre : Nom complet, Courriel, Téléphone, Entreprise,
Site web actuel, Forfait visé, Budget estimé, Urgence du projet, Description
du besoin. Les champs Forfait / Budget / Urgence sont exactement ceux
consommés par `src/scoring.js` pour calculer le `bw_lead_score` et la
priorité P1 / P2 / P3.

---

## 3. Asana — projet de livraison

- **Projet :** BlackWay – Livraison — GID `1217102441463342`
- **URL :** https://app.asana.com/1/1216895175256768/project/1217102441463342
- **Champs personnalisés :** Forfait BW (enum), Priorité BW (P1/P2/P3),
  Client (texte), Deal HubSpot (texte), Montant CAD (nombre)
- **Gabarit :** 5 sections (Brief & accès, Production, QA, Déploiement,
  Maintenance / Grow Hub) et 20 sous-tâches

Détail complet des GID dans `build-asana.md`.

---

## 4. Code — mise à jour du moteur

- Nouveau fichier `src/forfaits.js` : grille tarifaire réelle + tous les
  identifiants Stripe LIVE, avec `detecterForfait()` (metadata → lien →
  prix → produit) et `offreGrowHub()` pour la relance d'abonnement après
  chaque activation payée.
- `src/config.js` ré-exporte désormais cette grille : les anciens noms de
  forfaits inventés ont été retirés.
- Syntaxe validée sur l'ensemble des fichiers `src/` et `scripts/`.

---

## 5. HubSpot — bloqué

Le connecteur HubSpot est en lecture seule et renvoie
`REQUIRES_REAUTHORIZATION` sur tous les objets CRM. Il n'existe aucun outil
de connecteur permettant de créer des propriétés, des pipelines ou des
workflows.

Le script `scripts/setup-hubspot.js` fait tout le travail (15 propriétés
`bw_*`, pipeline « BlackWay – Revenue », pipeline « BlackWay – Delivery »),
est idempotent et écrit les IDs dans `.env.generated`. Il suffit de le
lancer localement avec un token de Private App :

```bash
unzip blackway-engine.zip && cd blackway-engine
npm install
cp .env.example .env      # coller le token pat-na1-... dans HUBSPOT_TOKEN
node scripts/setup-hubspot.js
```

Portail HubSpot : 343472254 — créer la Private App ici :
https://app.hubspot.com/private-apps/343472254
