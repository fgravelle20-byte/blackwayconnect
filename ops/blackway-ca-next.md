# blackway.ca — prochaine action (après token OK)

## Déjà OK
- `CLOUDFLARE_API_TOKEN` valide (jeton **compte** BLACKWAY)
- Attach vérifie `/accounts/{id}/tokens/verify`
- `blackwayconnect.com` live (Workers Builds)

## Bloqueur actuel (19 sept. 2026)
1. `dig blackway.ca` = **NXDOMAIN** → domaine absent/expiré au **registre .ca**
2. API create zone = manque permission `zone.create` sur le jeton

## Owner — 2 clics max
1. Registraire .ca : restaurer / renouveler **blackway.ca**
2. Cloudflare (compte `eda7fc96…`) : **Add site** → `blackway.ca`  
   https://dash.cloudflare.com/eda7fc96b400297aaa0b185a26ad1846/

Puis dis **OK** → Attach DNS + 301 vers `.com`.
