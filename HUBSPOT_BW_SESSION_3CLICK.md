# HubSpot `bw_last_checkout_session` — 3 clics (optionnel)

**Statut auto-create :** `403` / `scope_denied_or_missing` — le token Private App n’a pas `crm.schemas.contacts.write`.  
**Claim portail :** déjà OK sans cette propriété (Cache 24h + deal `bw_stripe_payment_id`).

## Option A — créer la propriété (UI, ~1 min)

1. HubSpot → **Settings** → **Data Management** → **Properties** → **Contact properties** → **Create property**
2. Internal name : `bw_last_checkout_session` · Label : `BW Last Checkout Session` · Type : Single-line text · Group : `blackwayconnect` (ou Contact information)
3. Save → vérifie `GET https://api.blackwayconnect.com/health` → `hubspot_bw_session_prop: true`

## Option B — scope Private App (puis auto-create)

1. Settings → Integrations → Private Apps → ton app
2. Scopes → ajoute `crm.schemas.contacts.write` (garde contacts read/write)
3. Save → recharge `GET https://api.blackwayconnect.com/health` (pipe auto-crée la prop)
