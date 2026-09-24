# INTERDIT — `blackway.ca` (ordre propriétaire)

## Ordre clair

Le domaine **`blackway.ca`** (bare « BlackWay », sans `connect`) **n’est pas à nous / ne doit plus apparaître** dans ce repo ni dans les automatisations Cloudflare.

Ordre owner : **supprimer, bloquer, ne jamais recréer**.

## Interdit

- Workflow `attach-blackway-ca` / script `scripts/attach-blackway-ca.sh`
- `POST /zones` Cloudflare pour `blackway.ca`
- CNAME / page-rules / redirects pour `blackway.ca`
- PR du type #36 (« auto-create blackway.ca Cloudflare zone »)

## Autorisé uniquement

| Domaine | Rôle |
|---------|------|
| `blackwayconnect.com` | Site canonique + Paddle `/payer` |
| `www.blackwayconnect.com` | 301 → apex `.com` |
| `api.blackwayconnect.com` | Pipe |

Voir `ops/blackway-domains-paddle.md`.
