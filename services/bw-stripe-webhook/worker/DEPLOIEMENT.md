# Déploiement du Worker BlackWayConnect

Compte Cloudflare : **Unexa Logistics** (`eda7fc96b400297aaa0b185a26ad1846`)
Zone : **blackwayconnect.com** (`d6235ff0814e30690eccf5118ea014d5`)

## 1. Jeton API (prérequis)

Cloudflare → icône de profil → **API Tokens** → **Create Token** → modèle **« Edit Cloudflare Workers »**
→ *Account Resources* : `Unexa Logistics` → *Zone Resources* : `blackwayconnect.com` → Continue → Create Token.

Le jeton doit contenir au minimum :
- `Account · Workers Scripts · Edit`
- `Account · Workers KV Storage · Edit` (si anti-rejeu KV)
- `Zone · Workers Routes · Edit` (si domaine personnalisé)

Vérification : `GET https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/workers/scripts` doit répondre **200** (et non 403).

## 2. Déploiement

```bash
cd worker
npm install
npx wrangler deploy
```

## 3. Secrets (obligatoires)

```bash
npx wrangler secret put STRIPE_SECRET_KEY        # sk_live_...
npx wrangler secret put STRIPE_WEBHOOK_SECRET    # whsec_...  (fourni par Stripe à l'étape 4)
npx wrangler secret put HUBSPOT_TOKEN            # pat-na3-...
npx wrangler secret put SLACK_WEBHOOK_URL        # optionnel
```

Équivalent dashboard : Workers & Pages → `bw-stripe-webhook` → Settings → Variables → *Encrypt*.

## 4. Endpoint Stripe

URL du Worker : `https://bw-stripe-webhook.<sous-domaine>.workers.dev/webhooks/stripe`

Stripe → Developers → Webhooks → Add endpoint → événements :
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Copier le `whsec_...` retourné dans le secret `STRIPE_WEBHOOK_SECRET`, puis redéployer.

## 5. Domaine personnalisé (optionnel)

Workers & Pages → `bw-stripe-webhook` → Settings → Domains & Routes → Add → Custom Domain
→ `webhooks.blackwayconnect.com`. Cloudflare crée le DNS automatiquement.

## 6. Contrôles

```bash
curl https://<url>/health
# {"ok":true,"hubspot":true,"stripe":true,"signature":true,...}
```

Chaque champ doit être `true` — sinon un secret manque.

Un `POST /webhooks/stripe` sans signature valide doit répondre **400**.

## 7. Anti-rejeu KV (optionnel)

```bash
npx wrangler kv namespace create BW_EVENTS
```
Décommenter le bloc `[[kv_namespaces]]` dans `wrangler.toml` avec l'`id` retourné.
Sans KV, la garde `bw_stripe_payment_id` côté HubSpot bloque déjà les doublons.

## Note sur les tickets HubSpot

L'API `crm/v3/objects/tickets` renvoie actuellement `403 — « The scope needed for this API call
isn't available for public use »`. La création de ticket est volontairement **non bloquante** :
la chaîne Contact → Company → Deal → Note → Slack s'exécute normalement et un avertissement est
journalisé. Aucun redéploiement ne sera nécessaire quand le scope sera actif.
