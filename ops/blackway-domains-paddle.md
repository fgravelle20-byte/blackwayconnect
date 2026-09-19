# BlackWay domains → Paddle

## LOCK — domaine canonique (owner)

| Domaine | Paddle | Rôle |
|---------|--------|------|
| `blackwayconnect.com` | **APPROUVÉ** | Canonical site + checkouts |

- Canonical site : `https://blackwayconnect.com`
- `www.blackwayconnect.com` → 301 apex `.com`
- Checkouts site : storefront Paddle `https://vorixa.ca/pricing`

## FORBIDDEN — `blackway.ca`

**Ne jamais** recréer attach / zone Cloudflare / docs NXDOMAIN pour `blackway.ca`.  
PR #36 (auto-create zone) était une erreur — purgé ensuite.  
Détail : [`ops/BLACKWAY-CA-FORBIDDEN.md`](./BLACKWAY-CA-FORBIDDEN.md).

## Paths Paddle sur .com

`/paddle` `/acheter` `/checkout` `/encaisser` → `https://vorixa.ca/pricing`

## Wrangler routes

Production `wrangler.jsonc` binds `blackwayconnect.com` only.
