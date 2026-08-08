# BlackWayConnect — revenue plumbing

Marketing site (`blackway-site`) ↔ `blackway-pipe` (`api.blackwayconnect.com`) ↔ HubSpot ↔ mobile app (Base44).

## Live endpoints

| Role | URL |
|------|-----|
| Canonical site | `https://blackwayconnect.com` |
| www | `https://www.blackwayconnect.com` → **301** apex (`blackway-www`) |
| Pipe health | `https://api.blackwayconnect.com/health` → `{ ok, hubspot, stripe_secret, lead_key }` (booleans only; no token prefix) |
| Site health | `GET https://blackwayconnect.com/api/health` → `{ ok, pipe, lead_key, base44_key, ai, mobile }` (booleans only) |
| Lead ingest | `POST https://api.blackwayconnect.com/lead` + header `X-BW-Key` |
| Site lead proxy | `POST https://blackwayconnect.com/api/lead` (key stays server-side) |
| Mobile bootstrap | `GET https://blackwayconnect.com/api/mobile/bootstrap` (CORS `*.base44.app`) |
| Mobile lead | `POST https://blackwayconnect.com/api/mobile/lead` (`X-BW-Key` or `X-BW-Base44-Key`) |
| AI Secretary chat | `POST https://blackwayconnect.com/api/chat` (Workers AI + FAQ fallback) |
| Site public config | `GET https://blackwayconnect.com/api/config` |
| Client Master Portal | `https://blackwayconnect.com/portail` (+ `/portal`, `/en/portail`) — post-Stripe control center |
| Portal claim | `POST /api/portal/claim` → pipe `/portal/claim` (session_id or email) |
| Portal me | `GET /api/portal/me` (Bearer token) |
| Thank-you checklist | `https://blackwayconnect.com/merci` (+ `/thank-you`) — secondary activation steps |
| Stripe webhook | `POST https://api.blackwayconnect.com/webhooks/stripe` |
| App preview | `https://black-way-link.base44.app/` |

Worker `blackwayconnect` is **not** used and must not be modified/deleted.

## Grow Hub Stripe checkout (live)

Payment Links (CAD monthly) on account BlackWayConnect. Site CTAs open these with UTM + `client_reference_id`.

| Plan | CAD/mo | Payment Link |
|------|--------|--------------|
| Spark | 99 | https://buy.stripe.com/00w14m2HH4wX57M2d0eIw0w |
| Launch | 249 | https://buy.stripe.com/aFaaEWeqpd3t57M6tgeIw0z |
| Growth ★ | 499 | https://buy.stripe.com/28E8wO8218NdfMq5pceIw0x |
| Scale | 749 | https://buy.stripe.com/3cI5kC0zz5B143IbNAeIw0B |
| Command | 1249 | https://buy.stripe.com/fZucN4eqp7J97fU18WeIw0y |
| Partner | 2499 | https://buy.stripe.com/6oUaEW9655B11VA4l8eIw0A |
| Entreprise | — | Consultation `/contact` |

Catalog in code: `src/stripeConfig.ts`. Public mirror: `GET /api/config` → `checkout` · Mobile: `GET /api/mobile/bootstrap`.

### Stripe after_completion → Portail (live)

All 6 Grow Hub Payment Links redirect after payment to  
`https://blackwayconnect.com/portail?session_id={CHECKOUT_SESSION_ID}`.

| Plan | Payment Link ID |
|------|-----------------|
| Spark | `plink_1U1FMTAG7HUL9RtrDCjxRIl6` |
| Launch | `plink_1U1FMUAG7HUL9RtrqsOarwY3` |
| Growth | `plink_1U1FMTAG7HUL9RtrDvKqcL9e` |
| Scale | `plink_1U1FMzAG7HUL9RtrIPzQYi9n` |
| Command | `plink_1U1FMTAG7HUL9RtrODdZgiSo` |
| Partner | `plink_1U1FMYAG7HUL9RtruMZLdQo2` |

**Portal unlock after pay (no `STRIPE_SECRET_KEY` required):**  
1. Stripe webhook → pipe stores `cs_…` → email/forfait in Worker Cache (24h) **synchronously**, then HubSpot deal `bw_stripe_payment_id` + contact (async).  
2. `/portail?session_id=cs_…` → `POST /portal/claim` resolves **Cache → contact `bw_last_checkout_session` → deal payment id → Stripe API only if secret present**.  
3. UI retries claim a few seconds if webhook/redirect race. Email claim remains fallback (`/merci` CTA).  

Optional (durable contact prop) — **auto-create currently 403** (`hubspot_bw_session_prop: false`, `hubspot_bw_session_prop_create: scope_denied_or_missing`). Portal claim still works via Cache (24h) + deal `bw_stripe_payment_id`.

**HubSpot UI (do this once, ~1 min):**  
Settings → Data Management → Properties → Contact properties → Create property  
- Internal name: `bw_last_checkout_session`  
- Label: `BW Last Checkout Session`  
- Field type: Single-line text  
- Group: `blackwayconnect` (or Contact information)  

**Or** Private App scopes (Settings → Integrations → Private Apps → your token): add  
`crm.schemas.contacts.write` (+ keep existing `crm.objects.contacts.read/write`).  
Then `GET /health` should show `hubspot_bw_session_prop: true`.

Fallback: `/merci?src=stripe` still offers CTA primary → `/portail` + email claim.

Stripe webhook endpoint `we_1U0vQMAG7HUL9Rtr2FwSuZhT` points to  
`https://api.blackwayconnect.com/webhooks/stripe`  
(events: checkout completed/async success/fail/expired, `invoice.paid`, `invoice.payment_succeeded`).

### Activation forfait (auto — déjà en place)

Paiement Stripe du forfait choisi → pipe active **ce** forfait (pas un statut unique) :

| Stripe | HubSpot contact | Portail |
|--------|-----------------|---------|
| price / Payment Link / `client_reference_id` / metadata `bw_forfait` | `bw_forfait` + `bw_forfait_paye` = clé (`grow_hub_spark` … `grow_hub_partner`) + `lifecyclestage=customer` | claim lit le même forfait |

Spark payé → Spark. Growth payé → Growth. Idempotent (`bw_idempotency_key` / `bw_stripe_payment_id`).

Pipe resolve order: metadata `bw_forfait` → `client_reference_id` → `payment_link` (plink map) → price id → line description → amount cents.

## Parcours E2E — checklist forfaits (2026-08-06)

| Forfait | Lien Stripe | Webhook map | Portail unlock | Statut |
|---------|-------------|-------------|----------------|--------|
| Spark `grow_hub_spark` | [buy…](https://buy.stripe.com/00w14m2HH4wX57M2d0eIw0w) · plink `…DCjxRIl6` · price `…C2bJrFVP` | metadata + plink + price + 9900¢ | rank 1 (diagnostic, outils, checklist, secrétaire, forfaits, support) | **OK** |
| Launch `grow_hub_launch` | [buy…](https://buy.stripe.com/aFaaEWeqpd3t57M6tgeIw0z) · plink `…qsOarwY3` · price `…3QF6c4pC` | idem | rank 2 (+ relance, soumission, roi, comparer, grow_hub) | **OK** |
| Growth `grow_hub_growth` | [buy…](https://buy.stripe.com/28E8wO8218NdfMq5pceIw0x) · plink `…DvKqcL9e` · price `…gSob9cmw` | idem (+ landing `/grow-hub-growth`) | rank 3 (tous outils web) | **OK** |
| Scale `grow_hub_scale` | [buy…](https://buy.stripe.com/3cI5kC0zz5B143IbNAeIw0B) · plink `…IPzQYi9n` · price `…WL5IQyME` | idem | rank 4 (tous outils web) | **OK** |
| Command `grow_hub_command` | [buy…](https://buy.stripe.com/fZucN4eqp7J97fU18WeIw0y) · plink `…ODdZgiSo` · price `…c8R6DEdZ` | idem | rank 5 (tous outils web) | **OK** |
| Partner `grow_hub_partner` | [buy…](https://buy.stripe.com/6oUaEW9655B11VA4l8eIw0A) · plink `…uMZLdQo2` · price `…uTYWaERD` | idem | rank 6 (tous outils web) | **OK** |
| Entreprise | `/contact` (pas de Payment Link) | N/A | consultation | **OK** (hors Stripe) |
| Cell Signal | — | pipe prêt (`cell_signal`) | rank cell 1 | **GAP** — Payment Link à créer |
| Cell Route | — | pipe prêt (`cell_route`) | rank cell 2 | **GAP** — Payment Link à créer |
| Cell Fleet | — | pipe prêt (`cell_fleet`) | rank cell 3 | **GAP** — Payment Link à créer |
| Cell Command | — | pipe prêt (`cell_command`) | rank cell 4 | **GAP** — Payment Link à créer |

**CTA site :** `/forfaits` → chaque carte → `checkoutUrl(plan)` = Payment Link + `client_reference_id=site_web:grow_hub_*` + UTM.  
**Redirect Stripe (vérifié live) :** `after_completion` → `https://blackwayconnect.com/portail?session_id={CHECKOUT_SESSION_ID}` sur les 6 plinks Grow Hub.  
**HubSpot :** `bw_forfait` + `bw_forfait_paye` = clé exacte ; cellulaire → `bw_forfait_cellulaire` si prop existe.  
**Catalog code :** `src/stripeConfig.ts` · `src/portalTools.ts` · `pipe/index.js` (`PRICE_TO_FORFAIT` + `PLINK_TO_FORFAIT` + `AMOUNT_CENTS_TO_FORFAIT`).

### Pack Cellulaire — gap (ne pas inventer de liens)

Voir `STRIPE_CELLULAIRE_CHECKLIST.md` + `src/cellulaireConfig.ts` (`paymentLink: ""`). Site affiche contact tant que les liens sont vides.
## Mobile bridge (Base44)

| Endpoint | Role |
|----------|------|
| `GET /api/mobile/bootstrap` | Config publique (checkout, URLs) — CORS `*.base44.app` |
| `POST /api/mobile/lead` | Lead app → pipe (auth: `X-BW-Key` = `BW_LEAD_KEY` **ou** `X-BW-Base44-Key` = `BW_BASE44_API_KEY`) |
| `base44/functions/submit-lead` | Function Builder → pipe direct |
| `base44/APP_FULL_PRODUCT_PROMPT.md` | **Prompt à coller** — remplit l’app (Portail + outils + lead) |
| `base44/BUILDER_PROMPT.md` | Prompt historique (remplacé par APP_FULL) |

**App Base44 :** publiée — https://black-way-link.base44.app/ (`status=published`) — **UI encore coquille social** jusqu’au republish avec `APP_FULL_PRODUCT_PROMPT.md`. Secret `BW_LEAD_KEY` requis dans Base44 pour leads auto.  
**Vrai dashboard mobile :** https://blackwayconnect.com/portail  
**Deploy Apple (priorité après fill) :** `base44/APPLE_TESTFLIGHT_CHECKLIST.md` + prompt `base44/APPLE_STORE_COMPLIANCE_PROMPT.md`. Pas de projet Xcode dans ce repo — IPA via Base44 Mobile app tab.  
Voir `base44/README.md`.

## Provenance (source → HubSpot)

| Channel | `source` / notes |
|---------|------------------|
| Site contact form | `form_web` via `/api/lead` |
| AI Secretary widget | `source=campagne` + `message` contains `bw_source=ai_secretary_24h` |
| App signup / in-app lead | `app_mobile` → pipe `/lead` with `X-BW-Key` |
| Site Stripe checkout | Payment Link + `client_reference_id=site_web:grow_hub_*` + UTM |
| Mobile app deep link | `bw_source=mobile_app`, `bw_ref=site`, optional `bw_forfait` |
| Stripe Checkout / invoices | Stripe events → `/webhooks/stripe` (HMAC) |

Pipe forfait keys already include Grow Hub + `ai_scale` (Application mobile & IA).

## Base44 app (publiée)

- App live : https://black-way-link.base44.app/ (`apple-mobile-web-app-title=BlackWayConnect`, appId `6a65880b394194e76123d165`)
- Site config : `GET /api/config` → `app.status=published`
- **Critique :** Dashboard Base44 → Secrets → `BW_LEAD_KEY` (même clé Cloudflare) pour `POST` leads → HubSpot

### Wire leads / paiements

```json
{
  "email": "user@example.com",
  "prenom": "",
  "nom": "",
  "entreprise": "",
  "telephone": "",
  "message": "",
  "forfait": "grow_hub_growth",
  "source": "app_mobile",
  "urgence": "normal",
  "langue": "fr",
  "bw_source": "mobile_app"
}
```

Header: `X-BW-Key: <same BW_LEAD_KEY as pipe + site>`.

**Base44 Builder (app side):** store `BW_LEAD_KEY` as an app secret / env and send it only as the `X-BW-Key` header on lead POSTs. Never embed it in client-visible frontend code.

4. Optional: custom domain for the app (e.g. `app.blackwayconnect.com`) → set `APP_WEB_URL` on `blackway-site` and update `src/appConfig.ts`.

### Base44 Admin / SDK key (site Worker)

`BW_BASE44_API_KEY` is a **server-side secret on `blackway-site`** for future Base44 Admin/SDK calls (publish status, app management). It is **not** the lead ingest key.

| Secret | Where | Purpose |
|--------|-------|---------|
| `BW_LEAD_KEY` | pipe + site (+ Base44 Builder app env) | Authenticate `POST /lead` via `X-BW-Key` |
| `BW_BASE44_API_KEY` | `blackway-site` only (for now) | Future server-side Base44 Admin/SDK |

Presence only: `GET /api/health` → `base44_key: true|false` (never the key value). No Admin API call is wired yet — secret + types are ready for when Builder exposes usable Admin endpoints.

## Credentials you must provide (not invented)

| Item | Status |
|------|--------|
| `BW_LEAD_KEY` | Known — set on pipe + site secret; also set in Base44 Builder for app leads |
| HubSpot / Stripe on pipe | Already present (`/health` ok) |
| Grow Hub Payment Links / price IDs | Live — wired in `stripeConfig.ts` (revenu #1 web) |
| **Cellulaire Payment Links** | **À créer** — `cell_signal` 79 · `cell_route` 199 · `cell_fleet` 399 · `cell_command` 799 CAD/mo — metadata `bw_forfait=cell_*` · success `/portail?session_id={CHECKOUT_SESSION_ID}` · puis coller URLs dans `src/cellulaireConfig.ts` + `worker/index.ts` `CELLULAIRE_CHECKOUT` |
| HubSpot prop `bw_forfait_cellulaire` | Recommandé (texte) — pipe l’écrit si présent; sinon fallback `bw_forfait` |
| `BW_BASE44_API_KEY` | Set on `blackway-site` secret — ready for future Admin/SDK use |
| App Store URL | **User** — set `APP_STORE_URL` in `wrangler.jsonc` + `src/appConfig.ts` |
| Google Play URL | **User** — set `PLAY_STORE_URL` likewise |
| Stripe products metadata `bw_forfait` | Optional — pipe already aliases product names |
| `STRIPE_SECRET_KEY` on site | Not required for Payment Links; only if Checkout Sessions proxy is desired later |
| Custom app hostname DNS | **User** — optional |

## AI Secretary (Conseiller 24h)

Floating widget on all layout pages → `POST /api/chat` on `blackway-site`.

1. **Workers AI** binding `AI` in `wrangler.jsonc` (model `@cf/meta/llama-3.1-8b-instruct-fp8`).
2. Optional secret `OPENAI_API_KEY` if Workers AI is unavailable.
3. Deterministic FAQ fallback always on (prices from site catalog Spark $99 → Partner $2,499 CAD — not pipe `FORFAITS` legacy amounts).
4. Lead capture → `/api/lead` with HubSpot-safe `source: "campagne"` and `bw_source=ai_secretary_24h` in `message`.
5. Checkout CTAs use live Payment Links (`stripeConfig` / `/api/config`).

## Secrets deploy

```bash
npx wrangler secret put BW_LEAD_KEY        # on blackway-site; never commit
npx wrangler secret put BW_BASE44_API_KEY  # on blackway-site; never commit
# optional:
npx wrangler secret put OPENAI_API_KEY
```

Do not put `BW_LEAD_KEY`, `BW_BASE44_API_KEY`, or `OPENAI_API_KEY` in client JS or `wrangler.jsonc` vars.

Workers AI needs no API key secret — the `ai.binding` in `wrangler.jsonc` is enough (account Workers AI enabled).
