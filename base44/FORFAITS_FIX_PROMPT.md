# BACKLOG — Base44 Pack Cellulaire (APRÈS Apple TestFlight)

**Priorité maintenant :** `APPLE_TESTFLIGHT_CHECKLIST.md` + `APPLE_STORE_COMPLIANCE_PROMPT.md`.  
Ce fichier = plus tard seulement.

**Canal live (sans attendre Base44) :**
- Dashboard mobile inclus → https://blackwayconnect.com/portail
- Pack Cellulaire (revenu #2) → https://blackwayconnect.com/forfaits-cellulaire
- Grow Hub web (revenu #1) → https://blackwayconnect.com/forfaits

## Modèle de vente (Plan #1 — verrouillé)

| Élément | Rôle | Prix |
|---------|------|------|
| Grow Hub web Spark→Partner | Revenu #1 | Stripe existant |
| **Portail / « app » dashboard** | **Surplus inclus** — contrôle le dashboard partout | **$0** (inclus avec Grow Hub) |
| Pack Cellulaire Signal→Command | Revenu #2 optionnel — outils **terrain** différents | Stripe à créer |

- L’app **n’est pas** un 2ᵉ abo Grow Hub.
- L’app **n’est pas** un clone Spark–Partner.
- Pitch : *« Contrôle ton dashboard peu importe où tu es — sur mobile. Inclus avec ton forfait. »*

## Ce que Base44 Builder doit faire

1. Home CTA principal → ouvrir `https://blackwayconnect.com/portail` (dashboard mobile inclus).
2. Écran **Pack Cellulaire** (optionnel) → `GET https://blackwayconnect.com/api/mobile/bootstrap` → **`plansCellulaire[]`** seulement.
3. Checkout pack → `paymentLink` cellulaire + `bw_source=cellulaire` (si link null → contact).
4. Manifest : BlackWayConnect / Grow Hub dashboard — plus « social networking ».
5. Secrets : `BW_LEAD_KEY` si lead form.

## Bootstrap

`GET https://blackwayconnect.com/api/mobile/bootstrap`

- `site.portal` / dashboard = Portail inclus
- `plans[]` = Grow Hub web (référence)
- `plansCellulaire[]` = Pack Terrain payant seulement

## Done when

- [ ] CTA principal app = Portail (pas forfaits web)
- [ ] Grille payante app = plansCellulaire seulement
- [ ] Copy « dashboard inclus · Pack Cellulaire optionnel »
- [ ] Plus de grille Spark–Partner comme produit app
