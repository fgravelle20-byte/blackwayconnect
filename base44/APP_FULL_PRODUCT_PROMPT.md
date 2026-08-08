# Colle ce prompt ENTIER dans le chat IA Base44 Builder → puis Publish

Tu remplaces **immédiatement** l’app actuelle (coquille « social networking » / likes / Outils de recrutement) par le **vrai produit BlackWayConnect** : télécommande du Portail Client Master + outils qui marchent + lead + contact.

Preview cible : `https://black-way-link.base44.app/`  
App ID : `6a65880b394194e76123d165`  
Manifest name : **BlackWayConnect** (plus de description « social networking »).

---

## Vérité produit (obéir à 100 %)

| Chose | URL / fait |
|-------|------------|
| **Vrai dashboard client** | `https://blackwayconnect.com/portail` |
| Login portail | email du compte payeur → claim session |
| Outils qui marchent | `/diagnostic` `/outils` `/comparer` `/relance-panier` `/soumission` `/checklist` `/roi` `/grow-hub` |
| Forfaits payants Grow Hub | **site Safari seulement** → `/forfaits` (Apple : pas de Stripe abo **dans** la WebView) |
| Contact | `https://blackwayconnect.com/contact` · `serviceclient@blackwayconnect.com` · `tel:+14502316911` · sans frais `tel:+18888539080` |
| Bridge public | `GET https://blackwayconnect.com/api/mobile/bootstrap` |
| Lead | function `submit-lead` + secret `BW_LEAD_KEY` → pipe HubSpot |

**Interdit :** faux likes, faux MRR, fake cards vides, « social network », Pack Cellulaire Stripe (paymentLink = null — **ne pas inventer**), hardcoder `BW_LEAD_KEY`, inventer App Store URL.

---

## Mission en une phrase

L’utilisateur ouvre l’app → en **1 tap** il est dans son Portail (forfait + outils) **ou** il envoie un lead / appelle le support. **Rien d’esthétique vide.**

---

## Backend — brancher AVANT de designer

1. Au démarrage app : `GET https://blackwayconnect.com/api/mobile/bootstrap`  
   Utiliser : `site.portal`, `site.tools`, `site.diagnostic`, `site.pricing`, `site.contact`, `site.home`, `support.email`, `qr.*`, `model.pitch`.  
   **Ne pas** afficher une grille checkout Stripe Grow Hub in-app.  
   **Ne pas** vendre `plansCellulaire` (liens null).

2. Function `submit-lead` (déjà dans le projet) : secret Dashboard `BW_LEAD_KEY` = même clé Cloudflare.  
   Payload forcé : `source=app_mobile`, `bw_source=mobile_app`, `bw_ref=base44_app`.

3. Optionnel : function `mobile-bootstrap` proxy si CORS frontend caprice — sinon fetch direct site OK (CORS `*.base44.app`).

---

## Architecture écrans (Tab bar — 5 onglets max)

```
Accueil | Portail | Outils | Lead | Plus
```

Supprime / remplace toute UI likes, feed, recrutement, commentaires, profil social.

### 1) Accueil (Home) — brand-first, PAS une grille de cards mortes

Viewport 1 seulement :
- **BlackWayConnect** hero-level (rouge `#e10600` sur noir profond)
- Headline FR : « Contrôle ton dashboard. Partout. »
- Headline EN : « Control your dashboard. Anywhere. »
- Une phrase : « Même Portail Client Master que le site — forfait, outils, support. »
- CTA primaire : **« Ouvrir mon Portail »** → ouvre  
  `https://blackwayconnect.com/portail?bw_source=mobile_app&bw_ref=base44_app&utm_source=grow_hub_app&utm_medium=app&utm_campaign=home_portal`  
  (WebView in-app **ou** SFSafari / navigateur système — les deux OK pour le Portail)
- CTA secondaire : **« Outils »** → onglet Outils
- CTA tertiaire (navigateur **externe** Safari) : **« Forfaits Grow Hub »** →  
  `https://blackwayconnect.com/forfaits?utm_source=grow_hub_app&utm_medium=app_store&utm_campaign=external_checkout&bw_source=mobile_app&bw_ref=base44_app`

Sous le fold (pas dans le hero) :
- 3 trust chips **honnêtes** seulement : « Stripe → HubSpot », « Bilingue FR/EN », « Québec · Canada · US »
- Aucun compteur inventé

### 2) Portail — LE cœur (pas une coquille)

Deux modes :

**A — Accès rapide (recommandé, zero friction)**  
Écran plein avec :
- Titre : « Portail Client Master »
- Texte : « Entre avec le courriel du compte qui a payé Grow Hub. »
- Champ email + bouton **« Ouvrir mon dashboard »**  
  → navigue vers  
  `https://blackwayconnect.com/portail?email={encodeURIComponent(email)}&bw_source=mobile_app&bw_ref=base44_app`  
  (le site **auto-claim** via `?email=` → `POST /api/portal/claim` — **ne réinvente pas** l’auth HubSpot côté Base44)
- Lien secondaire : ouvrir Portail sans email (même URL sans query)

**B — WebView embarquée (idéal si Base44 le permet)**  
Charge `site.portal` en WebView pleine hauteur sous une barre « Portail » minimale.  
C’est le **vrai** produit : forfait, outils débloqués, support.  
Si WebView cassée / auth cookies : fallback = ouvrir URL système.

**Affiche aussi (lecture seule, depuis bootstrap si dispo, sinon copy fixe) :**
- « Dashboard mobile = inclus avec Grow Hub »
- « Pack terrain = optionnel — bientôt / voir site » — **sans** bouton Stripe cellulaire

### 3) Outils — deep links qui MARCHENT (pas de cards décoratives)

Grille de tuiles. Chaque tuile = **lien réel** (in-app browser ou externe). Préserver `lang`, `bw_ref=base44_app`, `bw_source=mobile_app`.

| Tuile FR | URL |
|----------|-----|
| Diagnostic / Leak Score | `https://blackwayconnect.com/diagnostic` |
| Master Tools | `https://blackwayconnect.com/outils` |
| Comparateur | `https://blackwayconnect.com/comparer` |
| Relance panier | `https://blackwayconnect.com/relance-panier` |
| Soumission | `https://blackwayconnect.com/soumission` |
| Checklist 7 jours | `https://blackwayconnect.com/checklist` |
| Calculateur ROI | `https://blackwayconnect.com/roi` |
| Grow Hub Preview | `https://blackwayconnect.com/grow-hub` |
| Forfaits (Safari externe) | `https://blackwayconnect.com/forfaits` + UTM external_checkout |

Si une route 404 : retire la tuile. **Ne laisse pas de tuile « Bientôt » fake** sauf Pack Cellulaire clairement labelé « optionnel — pas encore activé ».

### 4) Lead — flow qui envoie vraiment

Formulaire : prénom, courriel*, téléphone opt, forfait (select depuis `bootstrap.plans[].key` labels), message opt.  
Submit → function `submit-lead`.  
Succès : message « Reçu. On te rappelle. » + bouton vers Diagnostic ou Portail.  
Erreur secret manquant : affiche « Configure BW_LEAD_KEY dans Base44 Secrets » (dev) / « Erreur envoi — écris à serviceclient@… » (prod soft).

### 5) Plus — langue, legal, contact, QR

- Toggle FR | EN
- Confidentialité : `https://blackwayconnect.com/confidentialite`
- Support email : `serviceclient@blackwayconnect.com` (mailto:)
- Contact page : `https://blackwayconnect.com/contact`
- **Appeler** : `tel:+14502316911` et/ou `tel:+18888539080` (aussi dans `bootstrap.support`)
- QR site : image `https://blackwayconnect.com/qr-site.svg` → ouvre `https://blackwayconnect.com`
- QR outils : `https://blackwayconnect.com/qr-outils.svg` → `/outils`
- Version / appId visible en petit : `6a65880b394194e76123d165`

---

## Brand & motion

- Noir + `#e10600`, typo expressive (pas Inter/Roboto)
- Fond avec profondeur (dégradé / grain) — pas flat blanc générique
- Motion : fade hero, transition tab, pulse léger CTA Portail
- Zero cards dans le hero. Cards seulement pour tuiles outils / form (interaction réelle)

---

## Manifest / store metadata (corriger MAINTENANT)

- name / short_name : **BlackWayConnect**
- description : « Portail Client Master mobile — forfait Grow Hub, outils lead-to-revenue, support. Pas un réseau social. »
- theme_color : `#000000`
- **Supprime** toute copy « vibrant social networking / likes / community engagement »

---

## Secrets

Dashboard → Secrets → `BW_LEAD_KEY` = même valeur que Cloudflare (`blackway-site` / pipe).  
Jamais dans le code frontend.

---

## Done when (checklist Publish)

- [ ] Plus de feed likes / recrutement / social
- [ ] CTA #1 Accueil = Portail Client Master (URL live)
- [ ] Onglet Outils = liens site qui ouvrent de vraies pages
- [ ] Lead POST fonctionne (ou message d’erreur honnête)
- [ ] Privacy + support visibles
- [ ] Zéro checkout Stripe abo **dans** la WebView (forfaits = Safari externe)
- [ ] Zéro Payment Link Cellulaire inventé
- [ ] Publié : `https://black-way-link.base44.app/` montre cette UI
- [ ] Manifest description ≠ social network

## Après Publish

1. Recharge hard `https://black-way-link.base44.app/`
2. Tap « Ouvrir mon Portail » → login email Portail
3. Puis seulement : `APPLE_STORE_COMPLIANCE_PROMPT.md` si pas déjà couvert → TestFlight (`APPLE_TESTFLIGHT_CHECKLIST.md`)
4. **Deliverable store principal du repo :** dossier `mobile/` (Capacitor) — voir `mobile/README.md` + compte Apple dans `APPLE_TESTFLIGHT_CHECKLIST.md` (ne pas afficher l’email Developer dans l’UI app)
