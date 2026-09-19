# BlackWay domains → Paddle (Vorixa)

## Goal

Unify `blackway.ca` + `blackwayconnect.com` and send **checkout** to **Paddle** on `vorixa.ca` while Stripe Connect is blocked.

## Live status (19 sept. 2026)

| Domain | DNS NS | A record | Action |
|--------|--------|----------|--------|
| `blackwayconnect.com` | Cloudflare ✅ | Cloudflare ✅ | Site Worker `blackway-site` |
| `blackway.ca` | Cloudflare ✅ (quincy/lana) | **missing** | Attach custom domain + deploy |

## Code (this branch)

1. Worker redirects:
   - `blackway.ca` / `www.blackway.ca` → `https://vorixa.ca/` (301)
   - `/paddle` `/acheter` `/checkout` `/encaisser` on `.com` → `https://vorixa.ca/pricing` (302)
2. Site CTAs (`checkoutUrl`) → `https://vorixa.ca/pricing` (Paddle storefront)
3. `wrangler.jsonc` routes for `blackway.ca` + `www.blackway.ca`

## Owner — Cloudflare Dashboard (2 min)

MCP Cloudflare auth was skipped in the agent session; finish attach here:

1. https://dash.cloudflare.com → zone **blackway.ca**
2. Workers & Pages → **blackway-site** → Triggers / Custom domains
3. Add **blackway.ca** and **www.blackway.ca**
4. Deploy: `npx wrangler deploy` from repo root (or merge this PR and let Workers Builds run)

After attach, `dig +short A blackway.ca` must show Cloudflare anycast (same family as `.com`).

## Do not

- Do not create another Stripe account
- Do not point `.ca` to Replit
- Keep Base44 mobile talking to `blackwayconnect.com` APIs
