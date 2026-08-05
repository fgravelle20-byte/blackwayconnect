# BlackWay Lead Engine + Deal Engine

Service backend Node.js pour **BlackWayConnect** (agence web/CRM québécoise) qui orchestre automatiquement le parcours d'un prospect, de la première visite du site jusqu'à la livraison du mandat :

- **Formulaire du site** → création de Lead qualifié dans HubSpot
- **Passage au stage "Qualified"** → création automatique d'un Deal
- **Paiement Stripe** → mise à jour du Contact, création du Deal "Payé", du Ticket de livraison, du projet Asana et notification Slack
- **Passage d'un Deal au stage "Payé"** (via HubSpot directement) → même pipeline de livraison

Tout le code, les commentaires et cette documentation sont en français.

---

## 1. À quoi sert ce service

Le BlackWay Lead Engine élimine la saisie manuelle entre 4 outils : le **site web** (formulaire de contact), **HubSpot** (CRM), **Stripe** (paiements) et **Asana** (livraison de projets), avec des notifications **Slack** à chaque étape clé.

Trois webhooks exposés :

| Événement déclencheur                     | Endpoint             |
|--------------------------------------------|-----------------------|
| Soumission du formulaire du site           | `POST /webhook/form`  |
| Paiement Stripe réussi                     | `POST /webhook/stripe`|
| Changement de propriété HubSpot            | `POST /webhook/hubspot`|

---

## 2. Prérequis

- Node.js 20 ou plus récent
- Un compte HubSpot avec une **Private App** (voir section 3)
- Un compte Stripe avec un webhook configuré (voir section 5)
- Un compte Asana avec un token d'accès personnel (PAT) (optionnel — si absent, la création de projet de livraison est simplement ignorée avec un avertissement dans les logs)
- Des **Incoming Webhooks Slack** pour les canaux `#blackway-leads`, `#blackway-wins`, `#blackway-delivery` (optionnels — même comportement que ci-dessus si absents)

Installation des dépendances :

```bash
cd blackway-engine
npm install
cp .env.example .env
# Éditez .env avec vos vraies valeurs
```

---

## 3. Créer la Private App HubSpot — scopes exacts à cocher

Dans HubSpot : **Paramètres → Intégrations → Applications privées → Créer une application privée**.

Onglet **Scopes**, cochez précisément :

**CRM — Lecture/Écriture :**
- `crm.objects.contacts.read` et `crm.objects.contacts.write`
- `crm.objects.companies.read` et `crm.objects.companies.write`
- `crm.objects.deals.read` et `crm.objects.deals.write`
- `crm.objects.leads.read` et `crm.objects.leads.write` *(objet Leads — nécessite un tier HubSpot le supportant, voir section 8)*
- `tickets` (lecture/écriture des tickets)
- `crm.schemas.contacts.read`, `crm.schemas.deals.read`, `crm.schemas.tickets.read` (pour la création de propriétés personnalisées via `scripts/setup-hubspot.js`)
- `crm.objects.custom.read` / `crm.objects.custom.write` si votre compte les exige pour l'objet Leads

**Automatisation :**
- `crm.objects.tasks.read` et `crm.objects.tasks.write` (création des tâches de suivi)

**Association :**
- `crm.associations.read` et `crm.associations.write` (associations Contact/Deal/Ticket/Lead)

**Webhooks (si vous utilisez l'onglet Webhooks natif de la Private App) :**
- Abonnez-vous aux propriétés `dealstage` (objet Deal) et `hs_pipeline_stage` (objet Lead/Ticket)

Une fois l'application créée, copiez le **jeton d'accès** affiché dans l'onglet **Auth** et collez-le dans `HUBSPOT_TOKEN` du fichier `.env`.

---

## 4. Lancer le script d'installation HubSpot

Ce script est **idempotent** : il vérifie toujours l'existant avant de créer quoi que ce soit, et peut être relancé sans risque de doublon.

```bash
node scripts/setup-hubspot.js
```

Il va :
1. Créer les propriétés personnalisées `bw_*` sur Contact, Deal, Ticket (si absentes)
2. Créer le pipeline Deals **"BlackWay – Revenue"** avec les étapes Diagnostic (10 %) → Proposition envoyée (25 %) → Négociation (50 %) → Contrat envoyé (70 %) → Facturé (90 %) → Payé (100 %, gagné) → Perdu (0 %, perdu)
3. Créer le pipeline Tickets **"BlackWay – Delivery"** avec les étapes Brief → En production → En QA → Déployé → Maintenance
4. Tenter de lire le pipeline de l'objet Leads (0-136) et **signaler clairement** si votre tier HubSpot ne le permet pas (HTTP 403/404)
5. Écrire les IDs des pipelines Deals/Tickets créés dans **`.env.generated`**

Copiez ensuite les valeurs de `.env.generated` vers `BW_DEAL_PIPELINE_ID` et `BW_TICKET_PIPELINE_ID` dans votre `.env` réel.

Le script affiche un rapport ligne par ligne avec le statut de chaque élément : `🟢 CRÉÉ`, `🟡 EXISTE DÉJÀ`, ou `🔴 ERREUR`.

> **Note sur l'objet Leads (0-136)** : cet objet est disponible seulement sur certains tiers HubSpot (généralement Sales Hub Pro/Enterprise avec l'objet Leads activé dans les paramètres du compte). Si votre compte ne le supporte pas, le script le signale sans faire échouer le reste de l'installation.

---

## 5. Configurer le webhook Stripe

1. Dans le [Dashboard Stripe](https://dashboard.stripe.com/webhooks), créez un endpoint pointant vers :
   ```
   https://votre-domaine.example.com/webhook/stripe
   ```
2. Abonnez-vous aux événements :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `invoice.paid`
3. Copiez le **secret de signature** (`whsec_...`) affiché et mettez-le dans `STRIPE_WEBHOOK_SECRET`.
4. Renseignez `STRIPE_SECRET_KEY` avec votre clé secrète Stripe.
5. Pour que le forfait acheté soit détecté automatiquement, ajoutez `metadata.forfait` (ex: `"Vitrine Pro"`) lors de la création de votre session Checkout côté site.

⚠️ La route `/webhook/stripe` **doit** recevoir le corps brut de la requête (non parsé en JSON) pour que la vérification de signature Stripe fonctionne. C'est déjà géré dans `src/server.js` — ne modifiez pas l'ordre des middlewares.

---

## 6. Brancher le formulaire du site BlackWayConnect

Depuis le formulaire de contact du site, faites un `POST` vers `/webhook/form` avec un corps JSON :

```json
{
  "nom": "Julie Tremblay",
  "courriel": "julie@exemple-entreprise.com",
  "entreprise": "Exemple Entreprise Inc.",
  "telephone": "514-555-0100",
  "forfait_souhaite": "E-commerce Pro",
  "budget": 12000,
  "urgence": "Élevée",
  "message": "Nous voulons relancer notre boutique en ligne d'ici 2 mois.",
  "source": "Form Web"
}
```

Champs requis : `nom`, `courriel` (validés par `zod`). Tous les autres champs ont des valeurs par défaut raisonnables si omis.

La réponse contient le score calculé, la priorité (`P1`/`P2`/`P3`) et les IDs HubSpot créés.

---

## 7. Déploiement (Railway / Render / Fly.io)

Le service est un simple serveur Express sans dépendance à un système de fichiers persistant (l'idempotence Stripe utilise un `Set` en mémoire — voir avertissement ci-dessous).

### Railway
1. Connectez votre repo Git, Railway détecte automatiquement Node.js.
2. Définissez la commande de démarrage : `npm start`.
3. Ajoutez toutes les variables de `.env.example` dans l'onglet **Variables**.
4. Railway assigne un domaine public — utilisez-le pour vos webhooks Stripe/HubSpot.

### Render
1. Créez un **Web Service** à partir du repo.
2. Build Command : `npm install`. Start Command : `npm start`.
3. Renseignez les variables d'environnement dans l'onglet **Environment**.

### Fly.io
1. `fly launch` (choisissez Node.js, pas de base de données).
2. `fly secrets set HUBSPOT_TOKEN=... STRIPE_SECRET_KEY=... etc.` pour chaque variable.
3. `fly deploy`.

> ⚠️ **Idempotence Stripe en production** : l'implémentation actuelle (`src/routes/stripe.js`) utilise un `Set` JavaScript en mémoire pour éviter de retraiter deux fois le même événement Stripe. Cela fonctionne pour **une seule instance** de processus. Si vous déployez plusieurs instances/replicas (scaling horizontal), remplacez ce `Set` par un store partagé comme **Redis** :
> ```js
> // Exemple d'implémentation Redis à la place du Set en mémoire :
> const dejaTraite = await redis.set(`stripe_event:${event.id}`, '1', { NX: true, EX: 86400 });
> if (!dejaTraite) { /* déjà traité, ignorer */ }
> ```

---

## 8. Limitations connues

- **Objet Leads (0-136)** : disponible seulement sur certains tiers HubSpot. Le script `setup-hubspot.js` détecte et signale l'indisponibilité sans bloquer le reste de l'installation.
- **Idempotence Stripe** : en mémoire, à migrer vers Redis en production multi-instance (voir section 7).
- **Instanciation de modèle Asana** (`ASANA_PROJECT_TEMPLATE_GID`) : l'API Asana traite cette opération de façon asynchrone (retourne un "job"). Le projet final peut prendre quelques secondes à apparaître ; le GID retourné immédiatement peut être celui du job plutôt que du projet si Asana n'a pas encore terminé le traitement.

---

## 9. Tableau des endpoints

| Méthode | Endpoint            | Description                                                                 |
|---------|----------------------|-------------------------------------------------------------------------------|
| GET     | `/health`            | Vérification de santé du service (utilisée par les plateformes de déploiement)|
| GET     | `/`                   | Message d'accueil et liste des endpoints                                     |
| POST    | `/webhook/stripe`     | Réception des événements Stripe (`checkout.session.completed`, `payment_intent.succeeded`, `invoice.paid`) |
| POST    | `/webhook/form`       | Réception des soumissions du formulaire de contact du site BlackWayConnect   |
| POST    | `/webhook/hubspot`    | Réception des webhooks HubSpot (changements de propriété Lead/Deal)          |

---

## 10. Structure du projet

```
blackway-engine/
├── package.json
├── .env.example
├── .env.generated        (généré par scripts/setup-hubspot.js)
├── README.md
├── scripts/
│   └── setup-hubspot.js
└── src/
    ├── config.js          (config, PRIX, stages, propriétés bw_*, CHECKLISTS)
    ├── logger.js          (logger pino partagé)
    ├── scoring.js         (calculerLeadScore, classerPriorite)
    ├── notify.js          (envoiSlack + générateurs de blocs Block Kit)
    ├── hubspot.js         (client API HubSpot v3 avec retry/backoff)
    ├── asana.js           (creerProjetLivraison)
    ├── server.js          (app Express, montage des routes)
    └── routes/
        ├── stripe.js          (webhook Stripe)
        ├── forms.js           (webhook formulaire du site)
        └── hubspot-webhook.js (webhook HubSpot)
```

---

## 11. Démarrage rapide

```bash
npm install
cp .env.example .env
# Renseignez .env, puis :
node scripts/setup-hubspot.js
# Copiez les IDs de .env.generated dans .env, puis :
npm start
```

Le serveur démarre sur le port défini par `PORT` (3000 par défaut) et affiche l'état de sa configuration dans les logs.
