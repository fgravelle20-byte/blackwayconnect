# BlackWayConnect — espace propriétaire

Code source : ce dépôt, branche `main`. Site public : `blackway-site`. Traitement CRM : `blackway-pipe`. Vue propriétaire préparée : `/controle` et `/api/owner/overview`.

## Ce que la vue lit réellement

Les 50 opportunités les plus récemment modifiées du pipeline BlackWay dans HubSpot, leurs contacts associés, leurs étapes de vente et leur statut de livraison. Ces nombres sont des aperçus, pas des totaux. « Paiement reçu » signifie l'étape HubSpot, pas un rapprochement bancaire. Aucun appel ni message n'est inventé.

## Activer l'accès privé avant déploiement

1. Dans Cloudflare Zero Trust, créer **une application Access self-hosted** avec une politique Allow limitée au courriel du propriétaire. Protéger les deux chemins `blackwayconnect.com/controle*` et `blackwayconnect.com/api/owner/*` dans la **même application** afin qu'ils partagent un audience tag.
2. Définir sur `blackway-site` les variables `CF_ACCESS_TEAM_DOMAIN` (ex. `mon-equipe.cloudflareaccess.com`), `CF_ACCESS_AUD` (audience tag de cette application) et `BW_OWNER_EMAIL` (courriel exact autorisé). Aucune valeur n'est inscrite dans le dépôt. Sans les trois variables et un JWT Access signé, l'API renvoie 403.
3. Confirmer que `BW_LEAD_KEY` est défini sur `blackway-site` et `blackway-pipe` et que `HUBSPOT_TOKEN` est présent sur le pipe. Le navigateur ne reçoit jamais ces clés.
4. Déployer les deux Workers après validation des secrets. Tester en navigation privée : propriétaire connecté → données réelles; visiteur non autorisé → aucun résultat. Vérifier aussi que le site public et `/portail` restent accessibles normalement.

La vérification Access valide signature RS256, émetteur, audience et courriel propriétaire. Le simple en-tête `Cf-Access-Jwt-Assertion` n'accorde aucun accès sans validation. L'endpoint privé utilise `Cache-Control: no-store` et le pipe exige la clé interne.

## Intégrations restantes

- Téléphonie : identifier le fournisseur et le webhook qui détient les appels BlackWay; le code actuel affiche des numéros publics sans journal d'appels centralisé. Ne pas mélanger avec l'assistant Vapi/Telnyx de l'app VORIXA.
- Messages : relier la boîte et les conversations à un journal d'activité privé.
- Paiements : rapprocher directement les événements Paddle avec les dossiers HubSpot avant d'afficher des montants encaissés.
- Automatisations : journaliser déclenchement, réussite et échec dans un événement propriétaire unique.

Ne pas fermer les branches historiques ni rebrancher le domaine sur une autre app avant d'avoir comparé les versions avec `main` et l'état déployé sur Cloudflare.
