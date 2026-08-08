# BlackWayConnect Grow Hub — App Blueprint

Produit mobile pour **revenu additionnel** BlackWayConnect.  
Preview : https://black-way-link.base44.app/  
Bridge live : `GET /api/mobile/bootstrap` · `POST /api/mobile/lead`

## North star
Un utilisateur ouvre l’app → avance un deal → checkout ou lead → HubSpot + Stripe.  
Rétention via streak + estimateur « revenue saved » (données locales, honnêtes).

## Information architecture

```
Tab bar
├── Home
├── Pipeline
├── Forfaits
├── Outils
└── Plus (Lead · Langue · Support)
```

## Screen specs

### Home
| Element | Spec |
|---------|------|
| Brand | « BlackWayConnect » hero-level, rouge `#e10600` sur noir |
| Headline FR | Ferme plus. Chaque jour. |
| Headline EN | Close more. Every day. |
| Support | Pipeline + Stripe + CRM — une seule provenance revenu |
| CTA primary | Ouvrir mon pipeline |
| CTA secondary | Voir les forfaits |
| Below fold | Estimateur local (inputs leads/taux/panier) + 3 trust chips honnêtes |

### Pipeline
| Stage | Color accent | Default next action |
|-------|--------------|---------------------|
| Lead | #e10600 soft | Qualifier |
| Qualifié | amber | Envoyer proposition |
| Proposition | white | Relancer |
| Clôture | lime | Encaisser |
| Gagné | gold | Upsell Partner |

Local storage key: `bw_pipeline_v1`. Sync lead → `submit-lead` on explicit send.

### Forfaits (CELLULAIRE — Type B)
Load **`plansCellulaire`** from bootstrap (NOT web `plans`).  
Featured = Cell Fleet 399. Keys: `cell_signal` 79 · `cell_route` 199 · `cell_fleet` 399 · `cell_command` 799.  
Checkout provenance `cellulaire`. Merge with Grow Hub web in Portail.

### Lead
Maps to pipe fields (`prenom`, `email`, `forfait`, …).  
Always `source=app_mobile`, `bw_source=mobile_app`, `bw_ref=base44_app`.

### Outils
Deep links only (no re-implement). Preserve UTM / bw_*.

### QR site (Plus / Profil — required)
Hotlink `bootstrap.qr.site` → `https://blackwayconnect.com/qr-site.svg`  
Opens `bootstrap.qr.siteUrl`. Optional second tile: `qr.outils` → `/outils`.

## Motion budget
1. Hero fade + slight rise (400ms)
2. Pipeline stage advance spring
3. CTA primary subtle pulse when streak at risk (no open today)

## Data contracts

### Bootstrap (public)
`GET https://blackwayconnect.com/api/mobile/bootstrap`  
See live JSON — `plans[]`, `checkout`, `site`, `provenance`.

### Lead (server function)
`submit-lead` → pipe. Never expose `BW_LEAD_KEY` to client.

## Revenue loop
```
Open app → streak++ → touch deal → Forfait CTA OR Lead form
         → Stripe Payment Link (MRR) OR HubSpot lead (sales)
         → thank-you / tools deep link → return tomorrow
```

## Honest social proof (allowed)
- « Paiements Stripe synchronisés au CRM »
- « Bilingue FR / EN »
- « Québec · Canada · États-Unis »
- Estimateur **calculé par l’utilisateur** (pas un faux total plateforme)

## Forbidden
Fake like counts, fake MRR, invented App Store URLs, hardcoded prices.
