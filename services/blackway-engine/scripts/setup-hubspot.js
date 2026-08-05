#!/usr/bin/env node
/**
 * scripts/setup-hubspot.js
 * ------------------------------------------------------------------
 * Script d'INSTALLATION idempotent du BlackWay Lead Engine côté
 * HubSpot. Il crée (s'ils n'existent pas déjà) :
 *
 *   1. Les propriétés personnalisées "bw_*" sur Contact, Deal, Ticket
 *   2. Le pipeline Deals "BlackWay – Revenue" avec ses étapes
 *   3. Le pipeline Tickets "BlackWay – Delivery" avec ses étapes
 *   4. Une tentative de lecture du pipeline de l'objet Leads (0-136),
 *      avec signalement propre si le tier HubSpot ne le permet pas.
 *
 * Le script est idempotent : il fait toujours un GET avant un POST
 * et ne recrée jamais un élément déjà existant.
 *
 * En sortie :
 *   - Un rapport clair ligne par ligne : CRÉÉ / EXISTE DÉJÀ / ERREUR
 *   - Un fichier .env.generated contenant les IDs de pipelines obtenus
 *
 * Utilisation :
 *   node scripts/setup-hubspot.js
 * (HUBSPOT_TOKEN doit être défini dans l'environnement ou dans .env)
 * ------------------------------------------------------------------
 */

import 'dotenv/config';
import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHEMIN_ENV_GENERATED = path.join(__dirname, '..', '.env.generated');

const TOKEN = process.env.HUBSPOT_TOKEN;
const BASE_URL = 'https://api.hubapi.com';

if (!TOKEN) {
  console.error('❌ HUBSPOT_TOKEN est absent. Définissez-le dans .env avant de lancer ce script.');
  process.exit(1);
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
});

/** Accumulateur du rapport final, affiché ligne par ligne. */
const rapport = [];

function logLigne(statut, libelle, details = '') {
  const icones = { CREE: '🟢 CRÉÉ', EXISTE: '🟡 EXISTE DÉJÀ', ERREUR: '🔴 ERREUR' };
  const prefixe = icones[statut] || statut;
  const ligne = `${prefixe} — ${libelle}${details ? ` (${details})` : ''}`;
  console.log(ligne);
  rapport.push({ statut, libelle, details });
}

/**
 * Crée une propriété personnalisée HubSpot sur un objet donné, si elle
 * n'existe pas déjà (vérification par GET avant POST).
 */
async function assurerPropriete(objectType, definition) {
  const { name, label, type, fieldType, groupName, options } = definition;
  try {
    await client.get(`/crm/v3/properties/${objectType}/${name}`);
    logLigne('EXISTE', `Propriété ${objectType}.${name}`);
    return { ok: true, cree: false };
  } catch (erreur) {
    if (erreur.response?.status !== 404) {
      logLigne('ERREUR', `Propriété ${objectType}.${name}`, erreur.response?.data?.message || erreur.message);
      return { ok: false, cree: false };
    }
  }

  try {
    const corps = {
      name,
      label,
      type,
      fieldType,
      groupName: groupName || undefined,
    };
    if (options) corps.options = options;

    await client.post(`/crm/v3/properties/${objectType}`, corps);
    logLigne('CREE', `Propriété ${objectType}.${name}`);
    return { ok: true, cree: true };
  } catch (erreur) {
    logLigne('ERREUR', `Propriété ${objectType}.${name}`, erreur.response?.data?.message || erreur.message);
    return { ok: false, cree: false };
  }
}

/** Liste des propriétés personnalisées à créer, par type d'objet. */
const PROPRIETES_A_CREER = {
  contacts: [
    { name: 'bw_forfait', label: 'Forfait BlackWay', type: 'string', fieldType: 'text' },
    { name: 'bw_source', label: 'Source BlackWay', type: 'string', fieldType: 'text' },
    { name: 'bw_icp', label: 'ICP BlackWay', type: 'string', fieldType: 'text' },
    { name: 'bw_budget_estime', label: 'Budget estimé BlackWay', type: 'number', fieldType: 'number' },
    { name: 'bw_urgence', label: 'Urgence BlackWay', type: 'string', fieldType: 'text' },
    { name: 'bw_lead_score', label: 'Score de lead BlackWay', type: 'number', fieldType: 'number' },
    { name: 'bw_forfait_paye', label: 'Forfait payé BlackWay', type: 'string', fieldType: 'text' },
    { name: 'bw_stripe_customer_id', label: 'ID client Stripe', type: 'string', fieldType: 'text' },
  ],
  deals: [
    { name: 'bw_forfait', label: 'Forfait BlackWay', type: 'string', fieldType: 'text' },
    { name: 'bw_source', label: 'Source BlackWay', type: 'string', fieldType: 'text' },
    { name: 'bw_segment', label: 'Segment BlackWay', type: 'string', fieldType: 'text' },
    { name: 'bw_deadline', label: 'Échéance BlackWay', type: 'date', fieldType: 'date' },
    { name: 'bw_lead_score', label: 'Score de lead BlackWay', type: 'number', fieldType: 'number' },
  ],
  tickets: [
    { name: 'bw_forfait', label: 'Forfait BlackWay', type: 'string', fieldType: 'text' },
    { name: 'bw_deal_lie', label: 'Deal lié BlackWay', type: 'string', fieldType: 'text' },
  ],
};

/**
 * Crée un pipeline HubSpot (Deals ou Tickets) avec ses étapes, si un
 * pipeline du même label n'existe pas déjà.
 *
 * @param {string} objectType - "deals" ou "tickets".
 * @param {string} label - Libellé du pipeline.
 * @param {Array<Object>} stages - Étapes du pipeline.
 */
async function assurerPipeline(objectType, label, stages) {
  try {
    const reponse = await client.get(`/crm/v3/pipelines/${objectType}`);
    const existant = reponse.data?.results?.find((p) => p.label === label);
    if (existant) {
      logLigne('EXISTE', `Pipeline "${label}" (${objectType})`, `id=${existant.id}`);
      return existant.id;
    }
  } catch (erreur) {
    logLigne('ERREUR', `Lecture des pipelines existants (${objectType})`, erreur.response?.data?.message || erreur.message);
    return null;
  }

  try {
    const corps = { label, displayOrder: 0, stages };
    const reponse = await client.post(`/crm/v3/pipelines/${objectType}`, corps);
    logLigne('CREE', `Pipeline "${label}" (${objectType})`, `id=${reponse.data.id}`);
    return reponse.data.id;
  } catch (erreur) {
    logLigne('ERREUR', `Création du pipeline "${label}" (${objectType})`, erreur.response?.data?.message || erreur.message);
    return null;
  }
}

/** Définition des étapes du pipeline Deals "BlackWay – Revenue". */
const ETAPES_DEALS = [
  { label: 'Diagnostic', displayOrder: 0, metadata: { probability: '0.10' } },
  { label: 'Proposition envoyée', displayOrder: 1, metadata: { probability: '0.25' } },
  { label: 'Négociation', displayOrder: 2, metadata: { probability: '0.50' } },
  { label: 'Contrat envoyé', displayOrder: 3, metadata: { probability: '0.70' } },
  { label: 'Facturé', displayOrder: 4, metadata: { probability: '0.90' } },
  { label: 'Payé', displayOrder: 5, metadata: { probability: '1.0', isClosed: 'true', dealClosed: 'true' } },
  { label: 'Perdu', displayOrder: 6, metadata: { probability: '0.0', isClosed: 'true' } },
];

/** Définition des étapes du pipeline Tickets "BlackWay – Delivery". */
const ETAPES_TICKETS = [
  { label: 'Brief', displayOrder: 0, metadata: {} },
  { label: 'En production', displayOrder: 1, metadata: {} },
  { label: 'En QA', displayOrder: 2, metadata: {} },
  { label: 'Déployé', displayOrder: 3, metadata: {} },
  { label: 'Maintenance', displayOrder: 4, metadata: {} },
];

/**
 * Tente de lire le pipeline de l'objet Leads (0-136), fonctionnalité
 * disponible seulement sur certains tiers HubSpot (Sales Hub Pro/Ent
 * avec l'objet Leads activé). Ne fait aucune écriture — signalement
 * propre en cas d'indisponibilité.
 */
async function verifierPipelineLeads() {
  try {
    const reponse = await client.get('/crm/v3/pipelines/leads');
    const nbPipelines = reponse.data?.results?.length || 0;
    logLigne('EXISTE', 'Pipeline objet Leads (0-136)', `${nbPipelines} pipeline(s) détecté(s)`);
    return reponse.data?.results || [];
  } catch (erreur) {
    const statut = erreur.response?.status;
    if (statut === 403 || statut === 404) {
      logLigne(
        'ERREUR',
        'Pipeline objet Leads (0-136)',
        `Non disponible sur ce compte/tier HubSpot (HTTP ${statut}). L'objet Leads nécessite généralement Sales Hub Pro/Enterprise avec l'objet Leads activé.`
      );
    } else {
      logLigne('ERREUR', 'Pipeline objet Leads (0-136)', erreur.response?.data?.message || erreur.message);
    }
    return null;
  }
}

async function main() {
  console.log('==================================================================');
  console.log(' Installation HubSpot — BlackWay Lead Engine');
  console.log('==================================================================\n');

  console.log('--- Étape 1/4 : Propriétés personnalisées ---');
  for (const [objectType, proprietes] of Object.entries(PROPRIETES_A_CREER)) {
    for (const propriete of proprietes) {
      await assurerPropriete(objectType, propriete);
    }
  }

  console.log('\n--- Étape 2/4 : Pipeline Deals "BlackWay – Revenue" ---');
  const dealPipelineId = await assurerPipeline('deals', 'BlackWay – Revenue', ETAPES_DEALS);

  console.log('\n--- Étape 3/4 : Pipeline Tickets "BlackWay – Delivery" ---');
  const ticketPipelineId = await assurerPipeline('tickets', 'BlackWay – Delivery', ETAPES_TICKETS);

  console.log('\n--- Étape 4/4 : Vérification du pipeline objet Leads (0-136) ---');
  await verifierPipelineLeads();

  // --- Écriture du fichier .env.generated ---
  const lignesEnv = [
    '# Fichier généré automatiquement par scripts/setup-hubspot.js',
    `# Généré le ${new Date().toISOString()}`,
    `BW_DEAL_PIPELINE_ID=${dealPipelineId || ''}`,
    `BW_TICKET_PIPELINE_ID=${ticketPipelineId || ''}`,
    '',
  ].join('\n');

  fs.writeFileSync(CHEMIN_ENV_GENERATED, lignesEnv, 'utf-8');
  console.log(`\n📄 IDs de pipelines écrits dans : ${CHEMIN_ENV_GENERATED}`);
  console.log('   Copiez ces valeurs dans votre fichier .env avant de démarrer le serveur.\n');

  // --- Résumé final ---
  const nbCrees = rapport.filter((r) => r.statut === 'CREE').length;
  const nbExistants = rapport.filter((r) => r.statut === 'EXISTE').length;
  const nbErreurs = rapport.filter((r) => r.statut === 'ERREUR').length;

  console.log('==================================================================');
  console.log(` Résumé : ${nbCrees} créé(s), ${nbExistants} déjà existant(s), ${nbErreurs} erreur(s).`);
  console.log('==================================================================');

  if (nbErreurs > 0) {
    process.exitCode = 1;
  }
}

main().catch((erreur) => {
  console.error('❌ Erreur fatale du script d\u2019installation :', erreur.message);
  process.exit(1);
});
