# blackway.ca — NXDOMAIN (priorité unique)

## Statut DNS live (19 sept. 2026 ~16:54 UTC)

```text
dig @8.8.8.8 blackway.ca NS  →  NXDOMAIN
dig @1.1.1.1 blackway.ca NS  →  NXDOMAIN
```

**Le domaine n’existe pas (ou plus) dans le registre .ca.**  
Ce n’est **pas** un problème de Worker, ni de page-rule, ni de secret GitHub.

`blackwayconnect.com` : NS Cloudflare OK · Workers Builds **success** sur `main` (site/pipe/sentinel).

## Ce qui est déjà 100 % (ne pas y retoucher)

| Item | État |
|------|------|
| PR #22 Unblock Vorixa collection | **MERGED** |
| Pack légal Paddle (ToS/Privacy/Refund) | **MERGED** + déployé Workers Builds |
| Checkouts `.com` → `vorixa.ca/pricing` | **dans main** + Workers Builds ✅ |
| Domaines approuvés Paddle (owner confirmé) | `.com` + `.ca` **LOCK — ne pas resoumettre** (approval ≠ DNS live) |

## Action propriétaire — UNE seule (dans l’ordre)

### 1. Remettre `blackway.ca` actif au registraire

1. Ouvre ton registraire .ca (CIRA / GoDaddy / Namecheap / Cloudflare Registrar…).
2. Cherche **blackway.ca** :
   - **Expired / Redemption / Deleted** → renouveler / restaurer.
   - **Active** mais NS absents → pointe les NS vers Cloudflare (`quincy` / `lana` ou ceux du Dash).
3. Attends que ça résolve :

```bash
dig +short NS blackway.ca
# doit retourner des NS (ex. cloudflare), PAS NXDOMAIN
```

### 2. Ensuite seulement — DNS + redirect (2 min)

**Option Dash (recommandé tant que le token Actions est invalide) :**

1. Cloudflare → zone `blackway.ca` (ajoute la zone si absente).
2. DNS :
   - CNAME `@` → `blackwayconnect.com` (Proxied)
   - CNAME `www` → `blackwayconnect.com` (Proxied)
3. Redirect Rule / Page Rule : `*blackway.ca/*` → `https://blackwayconnect.com/$1` (301)
4. Workers → `blackway-site` → Custom Domains → `blackway.ca` + `www.blackway.ca`

**OU** après domaine actif : régénère `CLOUDFLARE_API_TOKEN` (voir `ops/cloudflare-secrets-blocker.md`) → Run workflow **Attach blackway.ca**.

### 3. Vérif

```bash
dig +short blackway.ca          # IPs Cloudflare
curl -sI https://blackway.ca    # 301 → blackwayconnect.com
```

## Ne pas faire

- Ne pas resoumettre Paddle en boucle.
- Ne pas toucher pricing Vorixa / forfaits.
- Ne pas lancer d’autre chantier tant que `dig blackway.ca` ≠ NXDOMAIN.
