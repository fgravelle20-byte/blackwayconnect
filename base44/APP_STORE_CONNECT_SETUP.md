# App Store Connect — BlackWayConnect (prêt à coller)

**ASC app :** [6797345749](https://appstoreconnect.apple.com/apps/6797345749/distribution/ios/version/inflight)  
**Nom :** BlackWayConnect  
**Compte Apple :** **`f.gravelle20@icloud.com`**

### TestFlight — DONE (preuve ASC 2026-08-07)

| | |
|--|--|
| Version / build | **1.0.1** · build **102** |
| Status | **Prêt à soumettre** (Ready to submit) |
| Expire | ~88 jours |
| Groupe interne | **BlackWay** |
| TestFlight | https://appstoreconnect.apple.com/apps/6797345749/testflight/ios |

→ **IPA / upload = DONE.** Ce soir : **pas** regénérer d’IPA.  
→ Priorité : installer sur iPhone (Francis / groupe BlackWay) → finir **Distribution** (screenshots + métadonnées) pour review publique.

**Distribution (App Store listing) :** encore *À finaliser* (screenshots, textes EN/FR, privacy).  
**URL App Store publique :** vide — `APP_STORE_URL=""` jusqu’à Ready for Sale.

Checklist : `APPLE_TESTFLIGHT_CHECKLIST.md`.

---

## ⚠ Monétisation (CRITIQUE — rejet Apple sinon)

| Autorisé | Interdit |
|----------|----------|
| Portail, outils, leads dans l’app | **IAP** pour Grow Hub / abos digitaux |
| CTA « Forfaits » → **Safari externe** `https://blackwayconnect.com/forfaits` | Checkout Stripe **dans** la WebView |
| App **gratuite** (Free) | Produits In-App Purchases Grow Hub |

- **Ne crée aucun** In-App Purchase / Subscription dans ASC pour Grow Hub.
- Stripe reste **sur le site** uniquement.
- Review Notes (section D) doivent le dire clairement.

---

## Identifiants API (Base44 — pas Cursor)

| Champ | Valeur |
|-------|--------|
| Issuer ID | `85d92513-dbe1-411e-a611-8cf89f90e9e9` |
| Key ID | `UHS669ND42` |
| Team ID | *(Membership details → developer.apple.com — à coller une fois)* |
| Fichier `.p8` | `AuthKey_UHS669ND42.p8` — **upload UI Base44 seulement** |

### Où uploader le `.p8` (uploads **futurs** seulement)

Build **102** est déjà sur TestFlight → **pas besoin ce soir**.

Pour un **prochain** IPA Base44 :
1. Base44 → **Publish** → **Mobile app** → **Create App Store files**
2. Issuer + Key ID `UHS669ND42` + Team ID + upload `.p8` **dans l’UI Base44**

**NE PAS** : coller le contenu du `.p8` dans Cursor / Git / chat.

---

## A) Métadonnées version 1.0 — English (U.S.)

Coller dans ASC → App → iOS App → version 1.0 → **English (U.S.)**.

### Subtitle (≤30)

```
Client Master Portal mobile
```

### Promotional Text (≤170)

```
Control your Client Master Portal on the go. Score, tools, follow-ups — same dashboard as the web. Included with Grow Hub. Plans: blackwayconnect.com/forfaits (Safari).
```

### Description

```
BlackWayConnect puts your Client Master Portal on your phone: plan status, Master Tools, follow-ups, and support — the same dashboard you use on the web.

Open the app to run your account from anywhere in Québec, Canada, or the United States. Built for Grow Hub members who need their portal with them on the road.

Grow Hub subscriptions are sold only on our website (Safari) at https://blackwayconnect.com/forfaits — not as in-app purchases. This free app is your mobile remote for the portal and tools.

Support: serviceclient@blackwayconnect.com
Privacy: https://blackwayconnect.com/confidentialite
Website: https://blackwayconnect.com
```

### Keywords (≤100 characters, commas, no spaces after commas preferred)

```
crm,dashboard,portal,leads,pipeline,sales,quebec,business,hubspot,tools
```

### What's New

```
Initial release of BlackWayConnect: mobile access to the Client Master Portal, Master Tools deep links, and lead capture. Grow Hub plans stay on the website in Safari.
```

### URLs

| Champ | URL |
|-------|-----|
| Support URL | `https://blackwayconnect.com/contact` |
| Marketing URL | `https://blackwayconnect.com` |
| Privacy Policy URL | `https://blackwayconnect.com/confidentialite` |

---

## A′) Métadonnées version 1.0 — French (Canada)

Dans ASC → **App Information** / localisation → ajouter **French (Canada)** si absent, puis coller :

### Sous-titre (≤30)

```
Portail Client Master mobile
```

### Texte promotionnel (≤170)

```
Contrôle ton Portail Client Master partout. Score, outils, relances — même dashboard que le web. Inclus Grow Hub. Forfaits : blackwayconnect.com/forfaits (Safari).
```

### Description

```
BlackWayConnect te donne le Portail Client Master sur mobile : forfait, Master Tools, relances et support — le même dashboard que sur le web.

Ouvre l’app pour piloter ton compte où que tu sois au Québec, au Canada ou aux États-Unis. Conçue pour les membres Grow Hub qui veulent leur portail avec eux sur la route.

Les abonnements Grow Hub se vendent uniquement sur notre site (Safari) : https://blackwayconnect.com/forfaits — pas d’achats intégrés. Cette app gratuite est la télécommande mobile du portail et des outils.

Support : serviceclient@blackwayconnect.com
Confidentialité : https://blackwayconnect.com/confidentialite
Site : https://blackwayconnect.com
```

### Mots-clés (≤100)

```
crm,dashboard,portail,leads,pipeline,ventes,quebec,affaires,hubspot,outils
```

### Nouveautés

```
Première version de BlackWayConnect : accès mobile au Portail Client Master, liens Master Tools et capture de leads. Les forfaits Grow Hub restent sur le site web dans Safari.
```

### URLs (mêmes que EN-US)

Support `https://blackwayconnect.com/contact` · Marketing `https://blackwayconnect.com` · Privacy `https://blackwayconnect.com/confidentialite`

---

## B) Captures d’écran

### Tailles ASC (iPhone)

ASC demande souvent **6.5"** en premier pour cette fiche. Préparer au minimum :

| Display | Pixels (portrait) | Appareils typiques |
|---------|-------------------|--------------------|
| **6.5"** (requis ici) | **1242 × 2688** ou **1284 × 2778** | iPhone 11 Pro Max / XS Max / 6.5" slot |
| 6.7" (recommandé) | **1290 × 2796** | iPhone 14/15/16 Pro Max |
| 6.1" (optionnel) | **1179 × 2556** | iPhone 14/15/16 |

- Format : PNG ou JPEG, portrait, **sans** barre de statut trompeuse / fake storefront.
- **3–5** écrans utiles : Home app, Portail, Outils, (optionnel) Lead / Support.
- **Interdit :** écran checkout Stripe abo ; fausse photo de bureau / « notre office ».

### Comment capturer

**Option 1 — Simulateur iPhone (idéal)**  
Xcode → iPhone 11 Pro Max ou 15 Pro Max → ouvrir Portail / app → `Cmd+S` → redimensionner si besoin aux pixels ci-dessus.

**Option 2 — Safari / Chrome device mode**  
1. Ouvre `https://blackwayconnect.com/portail` (et Home Base44 / outils).  
2. DevTools → mode iPhone (ex. iPhone 14 Pro Max).  
3. Capture plein viewport → exporter PNG → crop/resize à **1242×2688** (6.5").

**Option 3 — TestFlight sur device réel**  
Après build : captures natives iOS (volume + side button).

### Dossier assets

Guides + bases : `base44/store-assets/` (et miroir `mobile/store-assets/` si Capacitor).  
Voir `base44/store-assets/README.md`.

---

## C) App Privacy / catégorie / âge

| Champ | Valeur |
|-------|--------|
| Catégorie primaire | **Business** |
| Catégorie secondaire | **Productivity** |
| Age Rating | **4+** (pas de contenu mature) |
| Prix | **Free** |

### App Privacy (nutrition labels) — guidance

Répondre selon le **comportement réel** de l’app Base44 / WebView :

| Donnée | Collectée ? | Liée à l’identité ? | Tracking (ATT) ? |
|--------|-------------|---------------------|------------------|
| **Email** (revendication Portail / login) | Oui, si login email | Oui | **Non** (sauf Meta/Ads dans l’app — Base44 actuel : probablement **pas**) |
| Nom / coordonnées lead | Oui si formulaire lead | Oui | Non |
| Identifiants appareil | Seulement si le wrapper le fait | Voir scan Base44 | Non sauf SDK pubs |
| Données de paiement in-app | **Non** (pas d’IAP ; Stripe = site) | — | — |
| Publicité / Meta Pixel in-app | **Non** sauf preuve contraire | — | Si Meta dans WebView → déclarer Tracking |

**Purposes typiques :** App Functionality, Customer Support (pas Advertising si zéro ads).  
**Third parties :** HubSpot via backend lead si applicable — « Used to track you » = **Non** si pas d’ads cross-app.

Ne coche **pas** « Tracking » si l’app n’embarque pas Meta / Facebook SDK / ads ID.

---

## D) Build → TestFlight → Review

### Statut build

- [x] IPA uploadée — TestFlight **1.0.1 (102)** · Prêt à soumettre · groupe **BlackWay**
- [ ] Install + smoke test iPhone (Francis)
- [ ] Distribution : screenshots + métadonnées EN/FR + privacy → Add for Review

### Ce soir (priorité)

1. **iPhone** — app TestFlight → BlackWayConnect **1.0.1 (102)** → installer (groupe interne BlackWay / Francis).
2. Smoke : Portail · Outils · pas de Stripe abo in-app · Privacy OK.
3. ASC **Distribution** (pas TestFlight) → coller métadonnées EN-US + FR-CA (section A) · screenshots **6.5"** · Privacy / Business / 4+ / Free · Review Notes → **Add for Review**.

`.p8` / nouveau IPA = **plus tard** seulement.

### Review Notes (coller EN)

```
BlackWayConnect is a free mobile remote for our Client Master Portal (web SaaS).

Demo: open the app → Portail / Client Master Portal. No paid account required to browse public portal entry; members sign in with the email used for Grow Hub.

Subscriptions: Grow Hub digital plans are purchased ONLY on the website https://blackwayconnect.com/forfaits in Safari (external browser). There are NO In-App Purchases and NO Stripe checkout inside the app WebView.

Support: serviceclient@blackwayconnect.com
Privacy: https://blackwayconnect.com/confidentialite
ASC Apple ID: 6797345749
```

### Ce que l’agent / Cursor ne peut pas faire sans ton login ASC

- Installer / accepter TestFlight sur ton iPhone
- Finaliser screenshots dans le slot Distribution ASC
- Submit for Review
- Lire ou coller ton `.p8`

(IPA déjà livré — pas besoin d’upload ce soir.)

Tu restes owner du login `f.gravelle20@icloud.com`.

---

## E) Après approval

Quand le listing est **Ready for Sale**, envoyer l’URL publique App Store → brancher :

- `src/appConfig.ts` → `APP_STORE_URL`
- `wrangler.jsonc` → `vars.APP_STORE_URL`
- deploy Worker **`blackway-site` seulement** — **jamais** Worker `blackwayconnect`

Jusque-là : `APP_STORE_URL=""` + référence interne ASC `6797345749` seulement.
