# Contacts HubSpot — nettoyage

**Source:** `Contacts prêts pour import HubSpot (765).csv`  
**Sortie:** `Contacts-HubSpot-CLEAN.csv`

| Métrique | Valeur |
|---|---|
| Entrée | 765 |
| Emails invalides / junk | 0 |
| Doublons email | 0 |
| **Conservés pour import** | **765** |
| Emails perso (gmail etc.) | 11 |
| Sans nom de famille | 223 |

## Règles appliquées
- Email normalisé lowercase + validation format
- Exclusion test/smoke/example/noreply + domaines jetables
- Déduplication stricte sur Email (1 contact = 1 email)
- Noms capitalisés, URLs https normalisées, téléphones digits only
- Lifecycle Stage = `lead` pour import HubSpot

## Prochaine étape
Import HubSpot → Contacts → Import → fichier `Contacts-HubSpot-CLEAN.csv`
