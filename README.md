# BlackWayConnect

Production marketing site for [blackwayconnect.com](https://blackwayconnect.com).

- Vite + React SPA (FR/EN)
- Cloudflare Worker `blackway-site` — static assets + `/api/lead` + `/api/chat` (AI Secretary 24h / Workers AI) → `blackway-pipe`
- Canonical host: `blackwayconnect.com` (`www` → 301 via `blackway-www`)
- Mobile app CTAs → [Base44 preview](https://black-way-link.base44.app/) with UTM provenance
- Pipe source (sanitized health): [`pipe/`](./pipe/) → Worker `blackway-pipe` only

See [INTEGRATION.md](./INTEGRATION.md) for pipe / Stripe / app wiring and credentials still needed.

## Develop

```bash
npm install
cp .dev.vars.example .dev.vars   # set BW_LEAD_KEY
npm run dev
```

## Deploy

```bash
npx wrangler secret put BW_LEAD_KEY
npm run deploy
# pipe (from repo root):
npx wrangler deploy -c pipe/wrangler.jsonc
```

## Hero & office video

Full-bleed `<video>` is wired via `src/CinematicMedia.tsx` (hero + « journée au bureau »).

1. Place a muted looping MP4 at **`public/hero.mp4`** and/or **`public/office-day.mp4`** (≤ ~4–6 MB, 1080p, H.264).
2. Keep **`public/hero-poster.jpg`** as LCP poster (preloaded). Office stills: `office-morning.jpg`, `office-team.jpg`, `office-ops.jpg`.
3. Until MP4 files exist, a cinematic film-strip of stills + Ken Burns motion fills the plane — no broken video flash.
4. Redeploy after dropping files: `npm run deploy` (Worker **`blackway-site`** only).

Do **not** commit huge unlicensed clips. Prefer your own bureau footage.

App Store / Play: set URLs in `src/appConfig.ts` and `wrangler.jsonc` vars.

Worker `blackwayconnect` must not be modified or deleted.
