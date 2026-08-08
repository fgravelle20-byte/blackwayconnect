# Colle ce prompt ENTIER dans le chat IA Base44 Builder

Tu construis l’app mobile web **BlackWayConnect Grow Hub** (Black Way Link) — un produit premium lead-to-revenue, pas une coquille brochure.

## Mission produit
Cette app existe pour **générer du revenu additionnel** pour BlackWayConnect :
- Capturer des leads qualifiés (`source=app_mobile`)
- Pousser le checkout Stripe Grow Hub (99 → 2499 CAD/mois)
- Faire revenir l’utilisateur chaque jour (pipeline, streak, outils Master Tools)
- Feeling : app consommateur top-tier (rapide, addictive, conversion-obsessed) — honnête, **aucun faux compteur de likes / faux 500k**

## Brand (non négociable)
- Noir profond + accent rouge `#e10600`
- Nom **BlackWayConnect** = signal hero (pas un eyebrow)
- Typo expressive (pas Inter/Roboto/Arial)
- Fond avec profondeur (dégradés / grain subtil) — pas flat blanc générique
- Motion : 2–3 animations intentionnelles (entrée hero, transition pipeline, pulse CTA)
- Zero cards dans le hero. Cards seulement si interaction réelle

## Backend (déjà prêt côté BlackWay)
1. Config publique : `GET https://blackwayconnect.com/api/mobile/bootstrap`  
   → forfaits, Payment Links, URLs outils, provenance
2. Function `submit-lead` (secret `BW_LEAD_KEY`) → `POST https://api.blackwayconnect.com/lead` + header `X-BW-Key`  
   Payload forcé : `source=app_mobile`, `bw_source=mobile_app`
3. Optionnel : function `mobile-bootstrap` qui proxy le bootstrap
4. Webhook Stripe (si Checkout maison) : `https://api.blackwayconnect.com/webhooks/stripe`

## Secrets (Dashboard → Secrets)
- `BW_LEAD_KEY` = (utilisateur colle la même valeur Cloudflare `blackway-site` / `blackway-pipe`)
- Ne JAMAIS hardcoder la clé dans le frontend

## Écrans (build all)

### 1) Home — brand-first killer
- Viewport 1 : BlackWayConnect (hero), une headline FR/EN, une phrase, un groupe CTA
- CTAs : « Ouvrir mon pipeline » + « Voir les forfaits »
- Sous le fold seulement : preuve sociale honnête (« Stripe + HubSpot synchronisés », « Bilingue FR/EN », « Québec → Canada → US ») — pas de faux stats inventés
- Micro-moment « revenue saved » : estimateur local (leads × taux × panier) stocké device — gamifié, pas menteur

### 2) Pipeline Grow Hub — interactif
Étapes : Lead → Qualifié → Proposition → Clôture → Gagné  
- Swipe / tap pour avancer un deal
- Chaque deal a : nom, forfait, montant CAD estimé, prochaine action
- Streak quotidien : +1 si l’utilisateur ouvre l’app et touche une action pipeline
- CTA sticky : « Envoyer ce lead à BlackWay » → écran Lead

### 3) Forfaits — one-tap Stripe
Charge `bootstrap.plans` (jamais hardcoder les prix).  
Spark 99 · Launch 249 · Growth 499 ★ · Scale 749 · Command 1249 · Partner 2499 · Entreprise = consultation site  
Chaque carte forfait : prix, bénéfice en 1 ligne, bouton « S’abonner » → `paymentLink` +  
`client_reference_id=app_mobile:{plan}` + UTM (`utm_source=grow_hub_app`, `utm_medium=checkout`, `utm_campaign={plan}`)

### 4) Lead capture
Champs : prénom, courriel, téléphone (opt), forfait, message (opt)  
→ appelle function `submit-lead`  
Succès : confetti discret + « On te rappelle. Pendant ce temps… » → deep link Master Tools

### 5) Master Tools (deep links site)
Tuiles vers :
- Diagnostic `https://blackwayconnect.com/diagnostic`
- ROI / outils `https://blackwayconnect.com/outils`
- Comparer `https://blackwayconnect.com/comparer`
- Forfaits site `https://blackwayconnect.com/forfaits`
Préserver query `lang`, `bw_ref=base44_app`, `bw_source=mobile_app`

### 6) Profil / langue + QR site (obligatoire)
Toggle FR | EN. Support : serviceclient@blackwayconnect.com  

**Section QR site** (écran Plus / Profil ou bas de Home) :
- Affiche le QR du site : image hotlink `https://blackwayconnect.com/qr-site.svg`  
  (aussi dans bootstrap → `qr.site` / `qr.siteUrl`)
- Label FR : « Site BlackWayConnect » · EN : « BlackWayConnect website »
- Tap/long-press ouvre `https://blackwayconnect.com`
- Optionnel : second QR outils `https://blackwayconnect.com/qr-outils.svg` → `/outils`
- Ne génère pas le QR côté app — utilise les SVG hébergés sur le site

## Copy tone (FR/EN)
- Direct, premium, revenu-first
- FR exemple headline : « Ferme plus. Chaque jour. »
- EN exemple headline : « Close more. Every day. »
- Sous-titre : le pipeline + paiements dans la poche — même CRM que le site
- CTA primaires : verbes d’action (« S’abonner », « Envoyer le lead », « Continuer mon streak »)

## Publish
Publie l’app pour que https://black-way-link.base44.app/ serve l’UI réelle (plus « isn't available yet »).

## Ne pas faire
- Ne pas hardcoder `BW_LEAD_KEY`
- Ne pas inventer d’autres prix que le bootstrap
- Ne pas inventer App Store / Play URLs
- Ne pas inventer de faux « 500k likes » ou compteurs viraux
- Ne pas casser l’auth existante
- Ne pas faire un CRUD administratif gris — c’est un produit conversion
