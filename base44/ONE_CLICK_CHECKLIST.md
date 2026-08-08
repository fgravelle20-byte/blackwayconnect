# Priorité vs backlog

## Compte Apple (interne)

| | |
|--|--|
| App Store Connect / Developer | **`f.gravelle20@icloud.com`** |
| Support client public | `serviceclient@blackwayconnect.com` |

Ne pas mettre l’email Apple sur le site marketing.

## Maintenant — BUILD app stores (Capacitor) + Apple

1. **Build natif repo :** `cd mobile && npm install && npm run sync` → voir `mobile/README.md`  
2. iOS : Mac + Xcode, signing avec **`f.gravelle20@icloud.com`** → TestFlight (`APPLE_TESTFLIGHT_CHECKLIST.md`)  
3. Android : Android Studio → `.aab` → Play Console  
4. **Parallèle Base44 :** colle **`APP_FULL_PRODUCT_PROMPT.md`** → Publish ; vérifie `https://black-way-link.base44.app/`  
5. Colle `APPLE_STORE_COMPLIANCE_PROMPT.md` si besoin → Publish  
6. Brancher `APP_STORE_URL` quand Ready for Sale (ASC id `6797345749` — pas d’URL publique avant)  
7. Listing coller-coller : `APP_STORE_CONNECT_SETUP.md`  

## Live sans attendre l’App Store

| Type | Revenu | URL |
|------|--------|-----|
| A WEB | #1 Grow Hub | https://blackwayconnect.com/forfaits |
| **Portail** | **Vrai dashboard mobile** | https://blackwayconnect.com/portail |
| Base44 web | Wrapper / preview | https://black-way-link.base44.app/ |

## Plus tard — ne pas faire maintenant

| Item | Fichier |
|------|--------|
| Pack Cellulaire Stripe Payment Links | `STRIPE_CELLULAIRE_CHECKLIST.md` (racine) |
| Vendre `plansCellulaire` dans Base44 | `FORFAITS_FIX_PROMPT.md` |
| Play Store | Même flow Base44, après Apple si tu veux |
