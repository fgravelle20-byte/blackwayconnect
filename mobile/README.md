# BlackWay Connect — App mobile (Capacitor)

App native **iOS + Google Play** : shell métier qui charge le **vrai** Portail Client Master + outils sur `blackwayconnect.com`.

**Ce n’est pas** un deploy marketing. **Ce n’est pas** la coquille sociale Base44.

| | |
|--|--|
| Stack | Capacitor 7 + Vite + WebView shell |
| Bundle ID | `com.blackwayconnect.app` |
| Nom | BlackWay Connect |
| Portail | WebView → `https://blackwayconnect.com/portail` |
| Forfaits / Stripe | **Navigateur externe** (Safari / Chrome) — règles Apple IAP |
| Contact | `serviceclient@blackwayconnect.com` · tel support (pas l’email Apple) |

## Compte Apple (interne — pas sur le site public)

| | |
|--|--|
| Apple Developer / App Store Connect | `f.gravelle20@icloud.com` |
| Login | [App Store Connect](https://appstoreconnect.apple.com) avec **cet** email |
| ASC Apple ID (app) | **`6797345749`** — listing public URL vide jusqu’à Ready for Sale |
| Textes / .p8 Base44 | `../base44/APP_STORE_CONNECT_SETUP.md` |

Support client reste `serviceclient@blackwayconnect.com`.

---

## Prérequis

- Node 20+
- **Android** : Android Studio + SDK
- **iOS** : Mac + Xcode 16+ + compte Apple ci-dessus

---

## 1 action pour voir l’app tourner (local web)

```bash
cd mobile
npm install
npm run dev
```

Ouvre `http://localhost:5174` — Accueil / Portail / Outils / Forfaits (externe) / Contact.

---

## Build shell + sync natif

```bash
cd mobile
npm install
npm run sync
```

`sync` = `vite build` + `npx cap sync` (copie `dist/` → Android / iOS).

---

## Android (Google Play)

```bash
cd mobile
npm run sync
npm run open:android
```

Dans Android Studio :

1. Wait for Gradle sync
2. Run sur émulateur / device (`Shift+F10`)
3. **Release Play** : Build → Generate Signed Bundle / APK → Android App Bundle (`.aab`)
4. Upload sur [Google Play Console](https://play.google.com/console)

Package : `com.blackwayconnect.app`

CLI alternatif :

```bash
npm run run:android
```

---

## iOS (TestFlight / App Store)

**Sur un Mac** (le dossier `ios/` est généré ; le build store exige Xcode) :

```bash
cd mobile
npm run sync
npm run open:ios
```

Dans Xcode :

1. Signing & Capabilities → Team = compte **`f.gravelle20@icloud.com`**
2. Bundle ID = `com.blackwayconnect.app`
3. Run sur simulateur / iPhone
4. Product → Archive → Distribute App → App Store Connect
5. TestFlight : [App Store Connect](https://appstoreconnect.apple.com) → login **`f.gravelle20@icloud.com`**

CLI :

```bash
npm run run:ios
```

Checklist détaillée : `../base44/APPLE_TESTFLIGHT_CHECKLIST.md`

---

## Ce qui fonctionne dans l’app

| Écran | Comportement |
|-------|----------------|
| **Accueil** | Brand + CTA Portail / Outils / Forfaits |
| **Portail** | Claim email + iframe live `/portail` |
| **Outils** | Tuiles → diagnostic, outils, comparer, relance, soumission, checklist, ROI, grow-hub |
| **Forfaits** | Ouvre Safari/Chrome → `/forfaits` (Stripe externe) |
| **Contact** | `tel:` local / sans frais, `mailto:serviceclient@…`, pages contact + confidentialité |

---

## Icônes / splash

Sources dans `resources/icon.png` + `resources/splash.png` (logo).

```bash
npm run assets
npm run sync
```

---

## Base44 (chemin parallèle)

Prompt produit : `../base44/APP_FULL_PRODUCT_PROMPT.md`  
Preview : `https://black-way-link.base44.app/`  

Le **deliverable store** de ce repo = **ce dossier `mobile/`**, pas un redeploy Wrangler du site marketing.
