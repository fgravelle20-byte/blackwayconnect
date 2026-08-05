/**
 * config.js
 * ------------------------------------------------------------------
 * Configuration centrale du BlackWay Lead Engine.
 * Regroupe : lecture des variables d'environnement, table des prix
 * par forfait, mapping des étapes (stages) de pipelines, et mapping
 * des noms de propriétés personnalisées HubSpot ("bw_*").
 *
 * Aucune clé secrète n'est codée en dur ici : tout provient de
 * process.env (voir .env.example).
 * ------------------------------------------------------------------
 */

import 'dotenv/config';

/** Petit utilitaire pour lire une variable d'env avec valeur par défaut. */
function env(nom, defaut = undefined) {
  const valeur = process.env[nom];
  return valeur === undefined || valeur === '' ? defaut : valeur;
}

export const config = {
  port: Number(env('PORT', 3000)),

  hubspot: {
    token: env('HUBSPOT_TOKEN', ''),
    baseUrl: 'https://api.hubapi.com',
  },

  stripe: {
    secretKey: env('STRIPE_SECRET_KEY', ''),
    webhookSecret: env('STRIPE_WEBHOOK_SECRET', ''),
  },

  slack: {
    leads: env('SLACK_WEBHOOK_LEADS', ''),
    deals: env('SLACK_WEBHOOK_DEALS', ''),
    delivery: env('SLACK_WEBHOOK_DELIVERY', ''),
  },

  asana: {
    token: env('ASANA_TOKEN', ''),
    workspaceGid: env('ASANA_WORKSPACE_GID', ''),
    projectTemplateGid: env('ASANA_PROJECT_TEMPLATE_GID', ''),
  },

  pipelines: {
    dealPipelineId: env('BW_DEAL_PIPELINE_ID', ''),
    ticketPipelineId: env('BW_TICKET_PIPELINE_ID', ''),
  },
};

/**
 * Table des prix par forfait (en dollars canadiens, montant utilisé
 * pour créer automatiquement les Deals HubSpot).
 * À ajuster selon la grille tarifaire réelle de BlackWayConnect.
 */
// La grille tarifaire réelle vit désormais dans src/forfaits.js
// (montants CAD + identifiants Stripe LIVE). On la ré-exporte ici pour
// conserver la compatibilité avec le code existant.
export { PRIX, FORFAITS, detecterForfait, offreGrowHub } from './forfaits.js';

/**
 * Étapes (stages) du pipeline Deals "BlackWay – Revenue".
 * Les clés internes sont utilisées dans le code ; les valeurs sont
 * les libellés attendus côté HubSpot (identiques aux "label" créés
 * par scripts/setup-hubspot.js).
 */
export const DEAL_STAGES = {
  DIAGNOSTIC: 'Diagnostic',
  PROPOSITION_ENVOYEE: 'Proposition envoyée',
  NEGOCIATION: 'Négociation',
  CONTRAT_ENVOYE: 'Contrat envoyé',
  FACTURE: 'Facturé',
  PAYE: 'Payé',
  PERDU: 'Perdu',
};

/** Étapes du pipeline Tickets "BlackWay – Delivery". */
export const TICKET_STAGES = {
  BRIEF: 'Brief',
  EN_PRODUCTION: 'En production',
  EN_QA: 'En QA',
  DEPLOYE: 'Déployé',
  MAINTENANCE: 'Maintenance',
};

/** Étapes du pipeline / lifecycle des Leads. */
export const LEAD_STAGES = {
  NEW: 'New',
  QUALIFIED: 'Qualified',
};

/**
 * Mapping des noms de propriétés personnalisées BlackWay ("bw_*")
 * utilisées sur les objets Contact / Deal / Ticket dans HubSpot.
 * Centraliser ces noms évite les fautes de frappe dispersées dans
 * le code et permet un renommage facile si nécessaire.
 */
export const PROPRIETES_BW = {
  contact: {
    forfait: 'bw_forfait',
    source: 'bw_source',
    icp: 'bw_icp',
    budgetEstime: 'bw_budget_estime',
    urgence: 'bw_urgence',
    leadScore: 'bw_lead_score',
    forfaitPaye: 'bw_forfait_paye',
    stripeCustomerId: 'bw_stripe_customer_id',
  },
  deal: {
    forfait: 'bw_forfait',
    source: 'bw_source',
    segment: 'bw_segment',
    deadline: 'bw_deadline',
    leadScore: 'bw_lead_score',
  },
  ticket: {
    forfait: 'bw_forfait',
    dealLie: 'bw_deal_lie',
  },
};

/**
 * Checklists de tâches standard par forfait, utilisées lors de la
 * création du projet de livraison Asana (voir src/asana.js).
 */
export const CHECKLISTS = {
  'Vitrine Essentielle': [
    'Collecte du contenu (textes, images, logo)',
    'Choix du gabarit et maquette rapide',
    'Intégration des pages (Accueil, Services, Contact)',
    'Configuration du nom de domaine et DNS',
    'Tests responsive et cross-browser',
    'Mise en ligne et formation client',
  ],
  'Vitrine Pro': [
    'Atelier de découverte avec le client',
    'Architecture de l\u2019information et wireframes',
    'Design UI sur mesure',
    'Intégration des pages et animations',
    'Intégration SEO de base (métadonnées, sitemap)',
    'Configuration analytics et formulaires',
    'Tests QA complets',
    'Mise en ligne et formation client',
  ],
  'E-commerce Starter': [
    'Configuration de la plateforme e-commerce',
    'Import du catalogue produits',
    'Configuration des paiements et taxes',
    'Configuration de l\u2019expédition',
    'Design des pages boutique',
    'Tests du parcours d\u2019achat de bout en bout',
    'Mise en ligne et formation client',
  ],
  'E-commerce Pro': [
    'Atelier de découverte et cartographie du parcours client',
    'Architecture technique (intégrations tierces)',
    'Design UI/UX sur mesure',
    'Développement des fonctionnalités avancées',
    'Configuration paiements, taxes et expédition',
    'Intégration marketing (email, remarketing)',
    'Tests de charge et QA complète',
    'Mise en ligne et formation client',
  ],
  'CRM Sur Mesure': [
    'Atelier de cadrage des processus d\u2019affaires',
    'Modélisation des objets et pipelines HubSpot',
    'Configuration des automatisations',
    'Intégrations tierces (facturation, calendrier, etc.)',
    'Migration des données existantes',
    'Formation approfondie de l\u2019équipe client',
    'Période de support renforcé post-lancement',
  ],
  'Refonte Complète': [
    'Audit du site existant (UX, SEO, technique)',
    'Nouvelle architecture de l\u2019information',
    'Nouveau design UI complet',
    'Redéveloppement du site',
    'Plan de redirection SEO',
    'Tests QA et validation client',
    'Mise en ligne et suivi post-lancement',
  ],
  Autre: [
    'Cadrage du besoin avec le client',
    'Proposition de plan de travail',
    'Réalisation du mandat',
    'Validation avec le client',
    'Livraison finale',
  ],
};
