# Tracking conversions (Meta + Google)

Vars (build Vite) — copier `.env.example` → `.env` local, ou CI secrets / vars avant `npm run build`.  
**Ne pas committer** les vrais IDs si sensibles.

```
VITE_META_PIXEL_ID=1234567890
VITE_GOOGLE_ADS_ID=AW-XXXXXXXXX
VITE_GOOGLE_ADS_PURCHASE_LABEL=xxxxx
```

Sans `VITE_META_PIXEL_ID`, le pixel est no-op (pas d’erreur). Redeploy **`blackway-site`** après changement d’env.

**Ce soir (1 ligne) :** dans `.env` avant `npm run deploy` — `VITE_META_PIXEL_ID=<ID Events Manager>` puis rebuild/redeploy `blackway-site` (sinon pubs Meta sans attribution).

Événements branchés :
- `PageView` — chaque route
- `ViewContent` — landing `/forfaits-growth`
- `InitiateCheckout` — clic Stripe Growth / forfaits
- `Lead` — formulaire contact / lead OK
- `Purchase` — `/merci?src=stripe` et `/portail` post-pay

Landing pub Growth : `https://blackwayconnect.com/forfaits-growth`  
Brief Meta 7 jours : `ads/GROWTH_META_7DAYS.md`
