# BlackWayConnect × Base44 — App mobile

## Priorité maintenant (app vide → utile)

L’app live `https://black-way-link.base44.app/` est encore une **coquille** (manifest « social networking », likes, pas de Portail).  
Le **vrai** produit utile = **Portail** `https://blackwayconnect.com/portail`.

| Doc | Quand |
|-----|--------|
| **`APP_FULL_PRODUCT_PROMPT.md`** | **Coller MAINTENANT** dans Base44 → Publish — remplit l’app |
| `APPLE_STORE_COMPLIANCE_PROMPT.md` | Après le fill, avant IPA |
| `APPLE_TESTFLIGHT_CHECKLIST.md` | Toi — TestFlight / Store |
| `APP_STORE_CONNECT_SETUP.md` | Textes ASC coller-coller EN+FR + .p8 Base44 |
| `BUILDER_PROMPT.md` / `APP_BLUEPRINT.md` | Historique (obsolète vs Portail-first) |
| `FORFAITS_FIX_PROMPT.md` | Backlog Pack Cellulaire — **plus tard** |

## Deux « apps » — ne pas confondre

| | Portail web | App Base44 → Apple |
|--|-------------|-------------------|
| URL | https://blackwayconnect.com/portail | https://black-way-link.base44.app/ |
| Rôle | **Dashboard réel** (forfait + outils) | Wrapper native / WebView pour l’App Store |
| Dans ce repo | Site `blackway-site` (React) | Specs + functions + prompts seulement |
| Native iOS | PWA « Ajouter à l’écran d’accueil » | IPA généré **dans Base44** (pas Xcode ici) |

Il n’y a **pas** d’Expo / Capacitor / Fastlane / projet Xcode dans ce repo.

## Bridge live (site Worker `blackway-site`)

| Élément | URL / statut |
|---------|----------------|
| Bootstrap | `GET https://blackwayconnect.com/api/mobile/bootstrap` |
| Lead proxy | `POST https://blackwayconnect.com/api/mobile/lead` |
| Health | `GET https://blackwayconnect.com/api/health` → `mobile: true` |
| App Base44 | https://black-way-link.base44.app/ — publiée mais **UI coquille** jusqu’au republish |
| App ID | `6a65880b394194e76123d165` |
| Privacy (store) | https://blackwayconnect.com/confidentialite |
| `APP_STORE_URL` | **vide** jusqu’à Ready for Sale (réf. ASC `6797345749` seulement) |

## Package dans ce dossier

| Fichier | Rôle |
|---------|------|
| **`APP_FULL_PRODUCT_PROMPT.md`** | **Prompt fill produit** (Portail + outils + lead) |
| `APPLE_TESTFLIGHT_CHECKLIST.md` | Checklist Québec FR → TestFlight / Store |
| **`APP_STORE_CONNECT_SETUP.md`** | **Métadonnées ASC EN+FR, screenshots, .p8 Base44, pas d’IAP** |
| `store-assets/README.md` | Tailles screenshots iPhone 6.5" |
| `APPLE_STORE_COMPLIANCE_PROMPT.md` | Prompt conformité Apple (Portail-first, pas Stripe in-app) |
| `BUILDER_PROMPT.md` | Prompt produit historique |
| `APP_BLUEPRINT.md` | Spec écrans historique |
| `copy/fr-en.json` | Copy FR/EN |
| `functions/submit-lead` | Lead → HubSpot via pipe |
| `functions/mobile-bootstrap` | Proxy bootstrap public |
| `FORFAITS_FIX_PROMPT.md` | Backlog cellulaire (ne pas prioriser) |

## Toi — ordre d’exécution

1. Colle **`APP_FULL_PRODUCT_PROMPT.md`** → Publish Base44 → hard refresh preview  
2. (Optionnel) Colle `APPLE_STORE_COMPLIANCE_PROMPT.md` si gaps Apple restent  
3. Suis `APPLE_TESTFLIGHT_CHECKLIST.md` (API key → scan → IPA → TestFlight)  
4. Quand l’URL App Store existe → `APP_STORE_URL` dans `src/appConfig.ts` + `wrangler.jsonc` → deploy `blackway-site`  
5. **Plus tard** seulement : Pack Cellulaire / `FORFAITS_FIX_PROMPT.md`

**En attendant TestFlight :** utilise `/portail` (mobile Safari → Ajouter à l’écran d’accueil).

## Secrets

- `BW_LEAD_KEY` dans Base44 Secrets = même valeur Cloudflare (leads)  
- `BW_BASE44_API_KEY` sur `blackway-site` = Admin (pas pour publish IPA)

## Interdits

- Ne pas toucher Worker nommé `blackwayconnect`  
- Ne pas inventer d’URL App Store  
- Ne pas pousser Stripe Cellulaire maintenant
