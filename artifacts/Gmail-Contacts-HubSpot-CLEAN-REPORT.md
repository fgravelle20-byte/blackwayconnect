# Gmail → HubSpot

## Source
Google Contacts connecté (Gmail) → export `Gmail-Contacts-RAW.csv` (1 393)

## Nettoyage
→ `Gmail-Contacts-HubSpot-CLEAN.csv` = **1 368** contacts valides  
(3 sans email, 22 doublons exclus)

## Import HubSpot (portail 343472254)
| Lot | Fichier | Résultat |
|---|---|---|
| Déjà présents (overlap liste précédente) | vs Contacts-HubSpot-CLEAN | **765** déjà dans HubSpot |
| Restants Gmail | `Gmail-Contacts-HubSpot-REMAINING.csv` | **603 créés** — 0 erreur |

**Total Gmail couvert dans HubSpot : 765 + 603 = 1 368**
