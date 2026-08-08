# Checklist Apple — TestFlight / App Store (Québec FR)

**Priorité #1 maintenant :** tester build TestFlight sur iPhone + finir listing Distribution (screenshots / textes).  
**IPA / TestFlight upload :** **DONE** — **1.0.1 build 102** (Prêt à soumettre).  
**Pas maintenant :** regénérer IPA · Payment Links Stripe Pack Cellulaire.

Docs officielles Base44 : https://docs.base44.com/documentation/building-your-app/uploading-to-app-stores  
Guide visuel Base44 : https://submit-your-app.base44.app/

---

## Verdict produit (verrouillé)

| Chose | C’est quoi | Où |
|-------|------------|-----|
| **Dashboard mobile utile** | Portail Client Master | https://blackwayconnect.com/portail |
| **App native Apple** | Wrapper Base44 (WebView) autour de l’app publiée | https://black-way-link.base44.app/ |
| **Revenu #1** | Grow Hub web | https://blackwayconnect.com/forfaits (Stripe **déjà live**) |
| **Pack Cellulaire** | Optionnel, plus tard | `/forfaits-cellulaire` — **ne pas pousser Stripe maintenant** |

**Chemin principal (repo) :** Capacitor dans `../mobile/` → Xcode / Android Studio → stores.  
**Chemin parallèle :** Base44 → IPA → App Store Connect → TestFlight.

**App Store / abos digitaux :** Apple refuse Stripe pour des abonnements digitaux *dans* l’app.  
→ Dans l’app native : dashboard Portail + outils + leads OK.  
→ Paiement Grow Hub : ouvrir Safari / site `/forfaits` (pas un Payment Link Stripe embarqué).  
→ Voir prompt : `APPLE_STORE_COMPLIANCE_PROMPT.md`.

---

## Compte Apple (interne — pas sur le site public)

| | |
|--|--|
| Apple Developer / App Store Connect | **`f.gravelle20@icloud.com`** |
| Login | https://appstoreconnect.apple.com → **cet email** |
| Support client (listing / app) | `serviceclient@blackwayconnect.com` (≠ email Apple) |

## Prérequis (coche avant de générer l’IPA)

- [ ] Compte **Apple Developer Program** actif — login **`f.gravelle20@icloud.com`**
- [ ] Connexion OK à [App Store Connect](https://appstoreconnect.apple.com/) avec **`f.gravelle20@icloud.com`**
- [ ] **Projet Capacitor store-ready** : `../mobile/` (bundle `com.blackwayconnect.app`) — chemin principal repo
- [ ] App Base44 **publiée** (chemin parallèle) : https://black-way-link.base44.app/
- [ ] Plan Base44 **Builder ou +** si tu génères l’IPA via Base44 (sinon Archive Xcode depuis `mobile/ios`)
- [ ] Logo app 1024×1024 PNG prêt (ou `mobile/resources/icon.png`)
- [ ] Privacy live : https://blackwayconnect.com/confidentialite
- [ ] Support listing : `serviceclient@blackwayconnect.com`
- [ ] Prompt conformité collé + **Republish** Base44 si tu utilises encore Base44 (`APPLE_STORE_COMPLIANCE_PROMPT.md`)
- [ ] Secret `BW_LEAD_KEY` dans Base44 → Secrets (leads → HubSpot) — utile mais **pas** bloquant pour TestFlight

**App ID Base44 (référence) :** `6a65880b394194e76123d165`  
**URL app Base44 :** `https://black-way-link.base44.app/`  
**App native repo :** `mobile/` — voir `mobile/README.md`

### App Store Connect — déjà créé

| | |
|--|--|
| **Apple ID (ASC)** | **`6797345749`** |
| Nom | BlackWayConnect |
| **TestFlight** | **1.0.1 · build 102** — **Prêt à soumettre** · expire ~88 j · groupe **BlackWay** |
| TestFlight URL | https://appstoreconnect.apple.com/apps/6797345749/testflight/ios |
| Distribution (store) | https://appstoreconnect.apple.com/apps/6797345749/distribution/ios/version/inflight — screenshots / textes **à finir** |
| **Textes coller-coller EN-US + FR-CA** | **`APP_STORE_CONNECT_SETUP.md`** |
| Screenshots guide | `base44/store-assets/README.md` |
| URL App Store publique | **vide** jusqu’à Ready for Sale (`APP_STORE_URL=""`) |

**Monétisation :** pas d’IAP Grow Hub — abos = Safari `/forfaits` seulement (détail dans `APP_STORE_CONNECT_SETUP.md`).

---

## A) App Store Connect — clé API (une seule fois)

**Clé déjà générée (réf.) :** Key ID **`UHS669ND42`** · Issuer ID **`85d92513-dbe1-411e-a611-8cf89f90e9e9`**  
→ Upload `.p8` **uniquement** dans Base44 → Create App Store files (jamais dans Cursor / Git). Voir `APP_STORE_CONNECT_SETUP.md`.

Si tu dois **recréer** une clé :

1. Ouvre https://appstoreconnect.apple.com/ → **Users and Access** → **Integrations** → **App Store Connect API**.
2. Note l’**Issuer ID** (en haut).
3. Clique **+** → nom `Base44 BlackWay` → rôle **Admin** → **Generate**.
4. Note le **Key ID**.
5. **Download** le fichier `.p8` **tout de suite** (Apple ne le redonne qu’**une fois**). Range-le hors Downloads / cloud public.
6. Team ID : https://developer.apple.com/account → **Membership details** → copie le **Team ID**.

Si tu ne vois pas l’onglet Keys : compte Apple pas encore activé (jusqu’à ~48 h après paiement) — attends le courriel d’activation.

---

## B) Base44 — scan + conformité

1. Ouvre l’éditeur Base44 de **Black Way Link**.
2. Colle `APPLE_STORE_COMPLIANCE_PROMPT.md` dans le chat IA → laisse appliquer.
3. Vérifie Home : CTA principal → **Portail** (`https://blackwayconnect.com/portail`).
4. Vérifie : **aucun** checkout Stripe Grow Hub / Cellulaire *dans* la WebView.
5. Liens visibles Privacy + Terms (ou `/confidentialite` + page conditions Base44) **avant** login.
6. **Publish**.
7. **Publish** (haut droite) → onglet **Mobile app**.
8. **Check Your App** → **Run App Scan** → **App Store guidelines**.
9. Corrige les issues **critiques** (Apply with AI / Copy Fix Prompt).
10. Republish → rescanner jusqu’à score acceptable (pas besoin de 100, zéro critique).

---

## C) Base44 — générer l’IPA

**SKIP ce soir** — build **102** déjà sur TestFlight.  
`.p8` + Create App Store files = seulement pour un **prochain** upload (voir `APP_STORE_CONNECT_SETUP.md`).

Erreurs fréquentes (si nouvel IPA plus tard) :

| Message | Fix |
|---------|-----|
| UNAUTHENTICATED / 401 | Recolle Issuer/Key/Team + nouveau `.p8` |
| PERMISSION_DENIED / 403 | Nouvelle clé API rôle **Admin** |
| ALREADY_EXISTS certs / 409 | developer.apple.com → Certificates → révoque un vieux **iOS Distribution** (max 3) |

---

## D) TestFlight — DONE → installer sur iPhone

- [x] App ASC **`6797345749`**
- [x] Build **1.0.1 (102)** · **Prêt à soumettre** · groupe interne **BlackWay**
- [ ] **Francis** : iPhone → app **TestFlight** → BlackWayConnect → **Installer** 1.0.1
- [ ] Smoke test :
    - [ ] Portail / dashboard
    - [ ] Outils / deep links
    - [ ] Lead (si secret OK)
    - [ ] **Pas** Stripe abo embarqué / **pas d’IAP**
    - [ ] Privacy accessible

---

## E) Soumission App Store (Distribution — encore bloqué)

Build TestFlight OK ≠ listing public. Coller depuis **`APP_STORE_CONNECT_SETUP.md`**.

Ordre ce soir :

1. [x] IPA → TestFlight **102** OK
2. [ ] Install + smoke iPhone (section D)
3. [ ] Métadonnées EN-US + FR-CA collées (Distribution)
4. [ ] Screenshots iPhone **6.5"** — guide `store-assets/`
5. [ ] Support / Marketing / Privacy URLs
6. [ ] Catégorie Business / Productivity · Age 4+ · Free · **aucun IAP**
7. [ ] App Privacy + Review Notes → **Add for Review**

Quand l’URL App Store est **Ready for Sale** → coller dans :

- `src/appConfig.ts` → `APP_STORE_URL`
- `wrangler.jsonc` → `vars.APP_STORE_URL`
- puis `npm run deploy` (Worker `blackway-site` seulement — **ne jamais** toucher Worker `blackwayconnect`)

Jusque-là : `APP_STORE_URL=""` — seule réf. interne = ASC `6797345749`.

---

## Textes listing

→ **Source de vérité :** [`APP_STORE_CONNECT_SETUP.md`](./APP_STORE_CONNECT_SETUP.md) (EN-US + FR-CA complets).

Rappel FR court : sous-titre `Portail Client Master mobile` · pas d’IAP · forfaits Safari `/forfaits`.

---

## Ce qu’on NE fait PAS maintenant

1. Regénérer IPA / re-uploader `.p8` ce soir (build **102** déjà là)
2. Créer des Payment Links Stripe **Cellulaire**
3. Pousser `cellulaireConfig` / checkout cellulaire dans l’app
4. Vendre Grow Hub **via Stripe dans** la WebView native (rejet Apple)
5. Toucher / supprimer le Worker nommé `blackwayconnect`
6. Inventer une URL App Store avant qu’elle existe

---

## Après smoke TestFlight — ping l’agent

Quand Distribution est soumis / Ready for Sale → envoie l’URL App Store → on branche `APP_STORE_URL`.
