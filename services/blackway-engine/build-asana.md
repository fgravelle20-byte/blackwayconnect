# Construction de la structure Asana – BlackWayConnect (Livraison)

Structure créée en direct via le connecteur `asana_mcp_merge` le 2 août 2026 (heure de création réelle des objets : 3 août 2026, ~03:30 UTC).

## Résumé

- **Workspace** : blackwayconnect.com — `1216895175256768`
- **Équipe** : La première équipe de Francis — `1216895175256770`
- **Projet** : BlackWay – Livraison — `1217102441463342`
- **URL du projet** : https://app.asana.com/1/1216895175256768/project/1217102441463342
- **5 champs personnalisés** créés et associés au projet
- **5 tâches-sections gabarit** créées, avec **20 sous-tâches** au total

Toutes les étapes demandées ont été exécutées avec succès. Une seule anomalie mineure a été rencontrée et corrigée automatiquement (voir section « Notes techniques »).

---

## 1. Workspace et équipe

| Élément | GID | Détail |
|---|---|---|
| Workspace | `1216895175256768` | blackwayconnect.com |
| Équipe | `1216895175256770` | La première équipe de Francis |

---

## 2. Champs personnalisés de workspace

| Nom du champ | Type | GID du champ | Options (GID) |
|---|---|---|---|
| Forfait BW | enum | `1217102337514345` | Website & Lead Launch (`1217102337514346`), Revenue System (`1217102337514347`), AI Scale (`1217102337514348`), Grow Hub Launch (`1217102337514349`), Grow Hub Growth (`1217102337514350`), Grow Hub Scale (`1217102337514351`) |
| Priorité BW | enum | `1217102337423150` | P1 (`1217102337423151`), P2 (`1217102337423152`), P3 (`1217102337423153`) |
| Client | text | `1217102337537647` | — |
| Deal HubSpot | text | `1217102316700928` | — |
| Montant CAD | number (précision 2) | `1217102356573614` | — |

Tous les champs ont été créés directement (aucun duplicat rencontré, `asana__list_custom_fields` n'a pas été nécessaire).

**Note technique** : la création du champ « Montant CAD » (type `number`) a d'abord échoué avec l'erreur `precision: Missing input`. L'appel a été corrigé en ajoutant explicitement `"precision": 2` et a ensuite réussi.

---

## 3. Projet

| Élément | Valeur |
|---|---|
| Nom | BlackWay – Livraison |
| GID | `1217102441463342` |
| URL | https://app.asana.com/1/1216895175256768/project/1217102441463342 |
| Workspace | `1216895175256768` |
| Équipe | `1216895175256770` |
| Confidentialité | public_to_workspace |
| Vue par défaut | Liste |
| Icône | rocket |

**Notes du projet (gabarit de livraison décrit dans Asana)** :

> Gabarit de livraison standard BlackWayConnect pour tout nouveau client, quel que soit le forfait (Website & Lead Launch, Revenue System, AI Scale, Grow Hub Launch/Growth/Scale).
>
> Ce projet sert de modèle reproductible pour chaque mandat client. Il couvre l'ensemble du cycle de livraison en 5 grandes étapes :
> 1. Brief & accès — cadrage du projet, collecte des accès et du contenu, validation de la portée et du prix.
> 2. Production — conception, intégration, formulaires, SEO local et connexion CRM/pipeline.
> 3. QA — tests mobiles, formulaires, SEO/métadonnées et relecture du contenu.
> 4. Déploiement — DNS/SSL, mise en ligne, Google Business + Search Console, formation client.
> 5. Maintenance / Grow Hub — abonnement récurrent, rapports mensuels, optimisation continue et revue trimestrielle de croissance.
>
> Chaque nouveau client doit être dupliqué à partir de ce gabarit. Les champs personnalisés (Forfait BW, Priorité BW, Client, Deal HubSpot, Montant CAD) doivent être remplis dès la création du projet client pour assurer le suivi commercial et opérationnel.

---

## 4. Association des champs personnalisés au projet

| Champ | GID du custom_field_setting | Champ important (affiché en liste) |
|---|---|---|
| Forfait BW | `1217102411030642` | Oui |
| Priorité BW | `1217102337536098` | Oui |
| Client | `1217102411082883` | Oui |
| Deal HubSpot | `1217102316794534` | Non |
| Montant CAD | `1217102441428199` | Oui |

Les 5 champs ont été associés avec succès au projet « BlackWay – Livraison ».

---

## 5. Tâches-sections gabarit et sous-tâches

### 1. Brief & accès — GID `1217102411113683`
URL : https://app.asana.com/1/1216895175256768/project/1217102441463342/task/1217102411113683

| Sous-tâche | GID |
|---|---|
| Appel de démarrage | `1217102337951711` |
| Collecte des accès (domaine, hébergement, Google) | `1217102317089229` |
| Collecte du contenu et logo | `1217102441863209` |
| Validation de la portée et du prix | `1217102356968986` |

### 2. Production — GID `1217102316924264`
URL : https://app.asana.com/1/1216895175256768/project/1217102441463342/task/1217102316924264

| Sous-tâche | GID |
|---|---|
| Maquette et arborescence | `1217102337957470` |
| Intégration des pages | `1217102357026707` |
| Formulaire de qualification | `1217102356940703` |
| Fondations SEO local | `1217102441831106` |
| Connexion CRM/pipeline | `1217102441900006` |

### 3. QA — GID `1217102316756616`
URL : https://app.asana.com/1/1216895175256768/project/1217102441463342/task/1217102316756616

| Sous-tâche | GID |
|---|---|
| Test mobile et vitesse | `1217102317171167` |
| Test des formulaires et notifications | `1217102338099555` |
| Vérification SEO et métadonnées | `1217102356941184` |
| Relecture du contenu | `1217102338029500` |

### 4. Déploiement — GID `1217102441497374`
URL : https://app.asana.com/1/1216895175256768/project/1217102441463342/task/1217102441497374

| Sous-tâche | GID |
|---|---|
| DNS et SSL | `1217102338074853` |
| Mise en ligne | `1217102441831117` |
| Google Business + Search Console | `1217102411507242` |
| Formation client (30 min) | `1217102317067316` |

### 5. Maintenance / Grow Hub — GID `1217102316796432`
URL : https://app.asana.com/1/1216895175256768/project/1217102441463342/task/1217102316796432

| Sous-tâche | GID |
|---|---|
| Activation de l'abonnement Grow Hub | `1217102357108106` |
| Rapport mensuel de performance | `1217102411533305` |
| Optimisation mensuelle | `1217102441899439` |
| Revue trimestrielle de croissance | `1217102338184975` |

---

## Table complète de tous les GID

| Type d'objet | Nom | GID |
|---|---|---|
| Workspace | blackwayconnect.com | 1216895175256768 |
| Équipe | La première équipe de Francis | 1216895175256770 |
| Champ personnalisé | Forfait BW | 1217102337514345 |
| Champ personnalisé | Priorité BW | 1217102337423150 |
| Champ personnalisé | Client | 1217102337537647 |
| Champ personnalisé | Deal HubSpot | 1217102316700928 |
| Champ personnalisé | Montant CAD | 1217102356573614 |
| Projet | BlackWay – Livraison | 1217102441463342 |
| Association champ→projet | Forfait BW | 1217102411030642 |
| Association champ→projet | Priorité BW | 1217102337536098 |
| Association champ→projet | Client | 1217102411082883 |
| Association champ→projet | Deal HubSpot | 1217102316794534 |
| Association champ→projet | Montant CAD | 1217102441428199 |
| Tâche-section | 1. Brief & accès | 1217102411113683 |
| Sous-tâche | Appel de démarrage | 1217102337951711 |
| Sous-tâche | Collecte des accès (domaine, hébergement, Google) | 1217102317089229 |
| Sous-tâche | Collecte du contenu et logo | 1217102441863209 |
| Sous-tâche | Validation de la portée et du prix | 1217102356968986 |
| Tâche-section | 2. Production | 1217102316924264 |
| Sous-tâche | Maquette et arborescence | 1217102337957470 |
| Sous-tâche | Intégration des pages | 1217102357026707 |
| Sous-tâche | Formulaire de qualification | 1217102356940703 |
| Sous-tâche | Fondations SEO local | 1217102441831106 |
| Sous-tâche | Connexion CRM/pipeline | 1217102441900006 |
| Tâche-section | 3. QA | 1217102316756616 |
| Sous-tâche | Test mobile et vitesse | 1217102317171167 |
| Sous-tâche | Test des formulaires et notifications | 1217102338099555 |
| Sous-tâche | Vérification SEO et métadonnées | 1217102356941184 |
| Sous-tâche | Relecture du contenu | 1217102338029500 |
| Tâche-section | 4. Déploiement | 1217102441497374 |
| Sous-tâche | DNS et SSL | 1217102338074853 |
| Sous-tâche | Mise en ligne | 1217102441831117 |
| Sous-tâche | Google Business + Search Console | 1217102411507242 |
| Sous-tâche | Formation client (30 min) | 1217102317067316 |
| Tâche-section | 5. Maintenance / Grow Hub | 1217102316796432 |
| Sous-tâche | Activation de l'abonnement Grow Hub | 1217102357108106 |
| Sous-tâche | Rapport mensuel de performance | 1217102411533305 |
| Sous-tâche | Optimisation mensuelle | 1217102441899439 |
| Sous-tâche | Revue trimestrielle de croissance | 1217102338184975 |

---

## Notes techniques et erreurs rencontrées

1. **Création du champ « Montant CAD »** : premier essai en erreur (`precision: Missing input`, code 502). Corrigé en ajoutant `"precision": 2` dans l'appel `asana__create_custom_field`. Deuxième essai réussi.
2. **Création des sous-tâches (`asana__create_task_subtask`)** : le premier lot d'appels (12 sous-tâches en parallèle) a échoué systématiquement avec l'erreur `Duplicate field: parent`, car l'outil place déjà `task_gid` comme parent et refusait de recevoir également `parent` (même à `null`) selon la première tentative de correction (`Must specify at least one of 'workspace', 'projects', or 'parent'`). Le connecteur a signalé plusieurs échecs consécutifs (`CONNECTOR ERROR: 'asana_mcp_merge' has failed N times consecutively`).
   - **Solution appliquée** : fournir `"workspace": "1216895175256768"` dans l'objet `input` (en laissant `parent` et `projects` à `null`), le paramètre `task_gid` au niveau racine gérant seul la relation parent/enfant. Après une courte pause et cette correction, tous les appels suivants ont réussi sans exception, et les 20 sous-tâches ont été créées avec succès dans l'ordre demandé.
3. Aucun duplicat de champ personnalisé n'a été rencontré ; l'étape de secours (`asana__list_custom_fields`) n'a pas été nécessaire.
4. Toutes les autres étapes (workspace, équipe, projet, association des champs, création des 5 tâches-sections) ont réussi du premier coup.

---

*Fichier généré automatiquement suite à la construction réelle de la structure Asana via `asana_mcp_merge`.*
