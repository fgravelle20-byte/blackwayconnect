# CUTOVER CLOUDFLARE → RAILWAY (5 minutes)

**Statut agent :** merge + Railway **FAIT**. Cutover DNS = **à faire dans ton Dashboard Cloudflare** (pas de `CLOUDFLARE_API_TOKEN` ici).

Worker actuel `blackwayconnect.f-gravelle20.workers.dev` = encore **"Hello world"** (pas le proxy). Il faut **redéployer** le code du repo puis attacher le domaine.

## Étape A — Déployer le Worker proxy (1 fois)

1. Ouvre https://dash.cloudflare.com → **Workers & Pages** → Worker **`blackwayconnect`**
2. Onglet **Settings → Builds** : branche = **`main`**, root = `/`, deploy command = `npx wrangler deploy`
3. Ou en local sur ton Mac :
   ```bash
   cd blackwayconnect
   npx wrangler login
   npx wrangler deploy
   ```
4. Vérifie :  
   `curl -sI https://blackwayconnect.f-gravelle20.workers.dev/health`  
   doit montrer Railway (pas "Hello world") et header `x-bw-proxy: railway-production`

## Étape B — Attacher le domaine (coupe ChatGPT)

1. Worker **blackwayconnect** → **Settings → Domains & Routes** → **Add**  
   - `blackwayconnect.com`  
   - `www.blackwayconnect.com`
2. DNS zone `blackwayconnect.com` : **supprime** tout CNAME vers `custom-domains.chatgpt.site` / ChatGPT Sites
3. Security : baisse ou désactive le **Bot Fight / Challenge** sur `/api/*` et webhooks (sinon Stripe/CF bloquent)

## Étape C — Vérif KING

```bash
curl -sI https://blackwayconnect.com/health | grep -iE 'x-bw-proxy|HTTP'
curl -sI https://blackwayconnect.com/api/v1/payments/buy/grow_hub_launch
# → 303 Location: https://buy.stripe.com/4gM8wO8216F52ZEeZMeIw0J
```

## En attendant le cutover

Vends / montre le site ici :  
**https://dependable-spirit-production.up.railway.app**
