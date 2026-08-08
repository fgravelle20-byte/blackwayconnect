# Meta Ads — Grow Hub Growth · 7 jours

Brief actionnable pour lancer ce soir. Objectif : **conversions** (Purchase + InitiateCheckout).

## Objectif campagne


| Élément        | Valeur                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| Objectif       | Conversions                                                                       |
| Événements     | **Purchase** (priorité) · **InitiateCheckout** (optimisation secondaire / volume) |
| Offre          | Grow Hub Growth — **499 $ CAD / mois**                                            |
| Landing        | `https://blackwayconnect.com/forfaits-growth`                                     |
| Checkout       | Stripe Payment Link (UTM `source=ads_growth` déjà câblé)                          |
| Après paiement | Portail Client Master → upsell Pack Cellulaire                                    |
| CTA téléphone  | **1-888-853-9080**                                                                |
| Email          | **[serviceclient@blackwayconnect.com](mailto:serviceclient@blackwayconnect.com)** |


URL exacte (ne pas raccourcir, ne pas ajouter de path) :

```
https://blackwayconnect.com/forfaits-growth
```

Paramètres UTM recommandés (optionnels — le checkout force déjà `ads_growth`) :

```
https://blackwayconnect.com/forfaits-growth?utm_source=meta&utm_medium=paid&utm_campaign=growth_7d&utm_content={{ad.name}}
```

---

## Variantes créatives (texte)

### FR A — Direct ROI


| Champ        | Texte                                                                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary text | Les leads arrivent. Personne ne ferme. Grow Hub Growth score, relance et mesure chaque opportunité — Portail Client + dashboard mobile inclus. 499 $/mois. Stripe. Annulable. |
| Headline     | Ferme plus de leads. 499 $/mois.                                                                                                                                              |
| Description  | Portail Master + IA 24h. Essai Stripe.                                                                                                                                        |


### FR B — Douleur PME


| Champ        | Texte                                                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary text | CRM plein, panier froid, soumissions sans suivi. BlackWay Connect branche HubSpot, score les fuites et pousse les relances — pour PME et équipes vente au Québec. 499 $ CAD/mois. |
| Headline     | Stoppez la fuite de leads.                                                                                                                                                        |
| Description  | Growth 499 $ · Stripe · annulable.                                                                                                                                                |


### FR C — Humain + produit


| Champ        | Texte                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary text | Pas juste une pub : un système. Score 60 s, pipeline, soumissions, paiements. Besoin d’un humain ? 1-888-853-9080 · [serviceclient@blackwayconnect.com](mailto:serviceclient@blackwayconnect.com). Sinon : abonnez Growth en un clic. |
| Headline     | Growth 499 $ — ou appelez-nous.                                                                                                                                                                                                       |
| Description  | Québec · HubSpot · Portail inclus.                                                                                                                                                                                                    |


### EN — 1 variante


| Champ        | Texte                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary text | Leads come in. Nobody closes. Grow Hub Growth scores, follows up and measures every opportunity — Client Master Portal + mobile dashboard included. $499 CAD/mo. Stripe. Cancel anytime. Call 1-888-853-9080. |
| Headline     | Close more leads. $499/mo.                                                                                                                                                                                    |
| Description  | Portal + AI 24/7. Stripe checkout.                                                                                                                                                                            |


---

## Audiences (intérêts / geo)

**Geo :** Canada · priorité **Québec** (Montréal, Laval, Longueuil, Québec, Gatineau) + RMR fortes. Langue : FR principal, EN en ad set séparé si budget.

**Intérêts / comportements (suggestions Meta) :**

- Petites entreprises / SMB, entrepreneurs, propriétaires d’entreprise
- Marketing digital, agences marketing, consultants
- CRM, HubSpot, Salesforce, Pipedrive (si dispo)
- E-commerce / WooCommerce / Shopify (PME qui vendent en ligne)
- Lead generation, inbound marketing
- Logiciels SaaS B2B, outils productivité

**Exclusions :** employés Meta/Google si bruit ; audiences trop larges « shopping » grand public.

**Lookalike (J3–J7 si données) :** acheteurs Stripe / InitiateCheckout site (pixel) 1 % Canada.

**Structure 7 jours :**

1. Ad set FR · Québec · intérêts SMB/CRM/agences
2. Ad set FR · Canada large (test) · même créas
3. (Option) Ad set EN · Canada · variante EN

3 ads FR (A/B/C) dans l’ad set principal — laisser Advantage+ créas **off** au départ pour lire le gagnant.

---

## Budget 7 jours (CAD)


| Scénario           | Quotidien           | Total ~7 j  | Notes                                   |
| ------------------ | ------------------- | ----------- | --------------------------------------- |
| Test lean          | **40–60 $ / jour**  | ~280–420 $  | 1 ad set FR Québec                      |
| Recommandé ce soir | **75–100 $ / jour** | ~525–700 $  | 2 ad sets (QC + CA)                     |
| Scale soft         | 120–150 $ / jour    | ~840–1050 $ | seulement si InitiateCheckout > 0 J2–J3 |


- Bid : Lowest cost · attribution 7 j clic / 1 j vue (défaut Meta)  
- Arrêt : si 0 InitiateCheckout après ~2× CPA cible estimé (ex. 80–120 $ dépensés sans IC) → pause + vérifier pixel  
- CPA Purchase cible indicative (test) : **sous 150–250 $** le premier cycle (apprentissage)

---

## Direction créative (visuel)

**Pas de nouveaux assets obligatoires.** Ne pas remplacer les images hero du site.

Utiliser :

- Image OG existante du site : `https://blackwayconnect.com/og.png` (ou export depuis Ads Manager « URL » / capture landing)
- Logo BlackWay (`/logo.png` ou PNG export Ads)
- Option rapide : capture plein écran de `/forfaits-growth` (mobile 9:16 + feed 1:1 / 4:5) — texte déjà sur la page, pas besoin de redesign

Formats : 1:1 feed, 4:5 feed, 9:16 Stories/Reels (même message, crop différent).

---

## Checklist technique (avant diffuser)

- [ ] `VITE_META_PIXEL_ID` défini au **build** du site (voir `TRACKING.md` / `.env.example`)
- [ ] Redeploy `blackway-site` après set de l’env
- [ ] Events Manager → tester sur `https://blackwayconnect.com/forfaits-growth` :
  - [ ] `PageView`
  - [ ] `ViewContent` (load landing)
  - [ ] `InitiateCheckout` (clic « S’abonner Growth »)
  - [ ] `Purchase` (après Stripe → `/merci` ou `/portail`)
- [ ] Domaine vérifié + pixel associé au compte pub
- [ ] Landing mobile OK + barre sticky Appeler / Acheter Growth
- [ ] Numéros joignables : **450-231-6911** (local) + **1-888-853-9080** (sans frais / pubs)
- [ ] Email **[serviceclient@blackwayconnect.com](mailto:serviceclient@blackwayconnect.com)** surveillé

---

## Funnel (rappel)

```
Meta ads → /forfaits-growth → Pixel ViewContent
         → CTA tel 1-888-853-9080 (ou 450-231-6911)  OU  Checkout Growth (InitiateCheckout)
         → Stripe Purchase → Portail → upsell Cellulaire
```

## Lancement ce soir — 3 premières étapes

1. Confirmer le Pixel ID dans le build + Events Manager voit `ViewContent` sur `/forfaits-growth`.
2. Créer campagne Conversions → Purchase, landing URL exacte ci-dessus, budget ~75–100 $/jour CAD.
3. Publier 3 variantes FR (A/B/C) + numéro **1-888-853-9080** dans la variante C / extensions si dispo.

