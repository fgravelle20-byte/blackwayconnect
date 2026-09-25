# Next step tools — 2026-09-25

Surgical upgrade (not a rebuild): Owner cockpit + Portail capture + Tools → HubSpot.

## 1. Owner `/controle`
- Affiche Twin Turbo (avg / max score) depuis `/ops/overview`
- Scores sur contacts / deals
- Checklist Access si 403
- `/api/health` → `owner_access` boolean

**Owner action :** poser `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, `BW_OWNER_EMAIL` sur `blackway-site` (voir `OWNER_CONSOLE.md`).

## 2. Portail capture réelle
- Route `/portail/capture` (+ `/en/portal/capture`)
- Outil `lead_capture` (web) + `cell_capture` (cellulaire) déverrouillés
- `POST /api/lead` avec `source=portail`, note `captured_by=…`

## 3. Master Tools → HubSpot
- Helper partagé `src/lib/postLead.ts`
- Relance panier / Soumission / Checklist envoient Twin Turbo fields + note CRM
- Succès UI avec score + CTA Paddle Growth
