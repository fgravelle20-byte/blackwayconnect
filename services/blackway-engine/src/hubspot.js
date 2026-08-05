/**
 * hubspot.js
 * ------------------------------------------------------------------
 * Client HubSpot API v3 pour le BlackWay Lead Engine.
 *
 * Fonctionnalités :
 *  - upsertContact(email, props)
 *  - upsertCompany(domain, props)
 *  - createLead(props, associations)
 *  - createDeal(props, associations)
 *  - createTicket(props, associations)
 *  - createTask(props, associations)
 *  - searchByEmail(objectType, email)
 *  - associate(fromType, fromId, toType, toId, assocTypeId)
 *  - getPipelines(objectType)
 *
 * Gestion des erreurs :
 *  - Retry avec backoff exponentiel sur les réponses HTTP 429
 *    (limite de débit HubSpot) et sur les erreurs réseau transitoires.
 *  - Toutes les erreurs définitives sont journalisées puis relancées
 *    sous forme d'une ErreurHubSpot typée, pour un traitement propre
 *    en amont (routes Express).
 * ------------------------------------------------------------------
 */

import axios from 'axios';
import { config } from './config.js';
import { logger } from './logger.js';

/** Erreur typée levée par le client HubSpot pour un traitement fin en amont. */
export class ErreurHubSpot extends Error {
  constructor(message, { statutHttp, corpsReponse, operation } = {}) {
    super(message);
    this.name = 'ErreurHubSpot';
    this.statutHttp = statutHttp;
    this.corpsReponse = corpsReponse;
    this.operation = operation;
  }
}

const NB_TENTATIVES_MAX = 5;
const DELAI_BASE_MS = 500;

/** Pause asynchrone (utilisée par le backoff exponentiel). */
function attendre(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const client = axios.create({
  baseURL: config.hubspot.baseUrl,
  timeout: 15000,
});

/**
 * Exécute une requête HubSpot avec gestion des 429 (backoff exponentiel
 * + respect de l'en-tête "Retry-After" si présent) et des erreurs
 * réseau transitoires (5xx, timeouts).
 *
 * @param {() => Promise<import('axios').AxiosResponse>} requeteFn
 * @param {string} operation - Nom lisible de l'opération (pour les logs/erreurs).
 */
async function executerAvecRetry(requeteFn, operation) {
  let derniereErreur;

  for (let tentative = 1; tentative <= NB_TENTATIVES_MAX; tentative += 1) {
    try {
      const reponse = await requeteFn();
      return reponse;
    } catch (erreur) {
      derniereErreur = erreur;
      const statut = erreur?.response?.status;
      const estRateLimit = statut === 429;
      const estErreurServeur = statut >= 500 && statut <= 599;
      const estErreurReseau = !erreur.response;

      const doitReessayer = (estRateLimit || estErreurServeur || estErreurReseau) && tentative < NB_TENTATIVES_MAX;

      if (!doitReessayer) {
        break;
      }

      const retryAfterHeader = erreur?.response?.headers?.['retry-after'];
      const delaiMs = retryAfterHeader
        ? Number(retryAfterHeader) * 1000
        : DELAI_BASE_MS * 2 ** (tentative - 1);

      logger.warn(
        { operation, tentative, statut, delaiMs },
        `[hubspot] Tentative ${tentative}/${NB_TENTATIVES_MAX} échouée pour "${operation}", nouvel essai après backoff.`
      );

      await attendre(delaiMs);
    }
  }

  const statutHttp = derniereErreur?.response?.status;
  const corpsReponse = derniereErreur?.response?.data;
  logger.error(
    { operation, statutHttp, corpsReponse, message: derniereErreur.message },
    `[hubspot] Échec définitif de l'opération "${operation}".`
  );
  throw new ErreurHubSpot(`Échec HubSpot lors de "${operation}": ${derniereErreur.message}`, {
    statutHttp,
    corpsReponse,
    operation,
  });
}

/** En-têtes d'autorisation HubSpot (Private App token). */
function enTetesAuth() {
  if (!config.hubspot.token) {
    logger.warn('[hubspot] HUBSPOT_TOKEN est absent — les appels HubSpot échoueront.');
  }
  return {
    Authorization: `Bearer ${config.hubspot.token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Recherche un objet HubSpot (contact, company, deal, ticket, etc.) par courriel.
 * @param {string} objectType - Type d'objet HubSpot ("contacts", "companies", ...).
 * @param {string} email
 */
export async function searchByEmail(objectType, email) {
  const reponse = await executerAvecRetry(
    () =>
      client.post(
        `/crm/v3/objects/${objectType}/search`,
        {
          filterGroups: [
            { filters: [{ propertyName: 'email', operator: 'EQ', value: email }] },
          ],
          limit: 1,
        },
        { headers: enTetesAuth() }
      ),
    `searchByEmail(${objectType}, ${email})`
  );
  return reponse.data?.results?.[0] || null;
}

/**
 * Crée ou met à jour un contact HubSpot par courriel (upsert).
 * @param {string} email
 * @param {Object} props - Propriétés HubSpot à définir.
 */
export async function upsertContact(email, props = {}) {
  if (!email) {
    throw new ErreurHubSpot('Impossible de faire un upsert de contact sans courriel.', {
      operation: 'upsertContact',
    });
  }

  const existant = await searchByEmail('contacts', email);
  const proprietes = { email, ...props };

  if (existant) {
    const reponse = await executerAvecRetry(
      () =>
        client.patch(
          `/crm/v3/objects/contacts/${existant.id}`,
          { properties: proprietes },
          { headers: enTetesAuth() }
        ),
      `upsertContact:update(${email})`
    );
    logger.info(`[hubspot] Contact mis à jour (id=${existant.id}, courriel=${email}).`);
    return reponse.data;
  }

  const reponse = await executerAvecRetry(
    () =>
      client.post(
        '/crm/v3/objects/contacts',
        { properties: proprietes },
        { headers: enTetesAuth() }
      ),
    `upsertContact:create(${email})`
  );
  logger.info(`[hubspot] Contact créé (id=${reponse.data.id}, courriel=${email}).`);
  return reponse.data;
}

/**
 * Crée ou met à jour une entreprise HubSpot par domaine (upsert).
 * @param {string} domain
 * @param {Object} props
 */
export async function upsertCompany(domain, props = {}) {
  if (!domain) {
    logger.warn('[hubspot] upsertCompany appelé sans domaine — opération ignorée.');
    return null;
  }

  const recherche = await executerAvecRetry(
    () =>
      client.post(
        '/crm/v3/objects/companies/search',
        {
          filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'EQ', value: domain }] }],
          limit: 1,
        },
        { headers: enTetesAuth() }
      ),
    `upsertCompany:search(${domain})`
  );

  const existant = recherche.data?.results?.[0];
  const proprietes = { domain, ...props };

  if (existant) {
    const reponse = await executerAvecRetry(
      () =>
        client.patch(
          `/crm/v3/objects/companies/${existant.id}`,
          { properties: proprietes },
          { headers: enTetesAuth() }
        ),
      `upsertCompany:update(${domain})`
    );
    logger.info(`[hubspot] Entreprise mise à jour (id=${existant.id}, domaine=${domain}).`);
    return reponse.data;
  }

  const reponse = await executerAvecRetry(
    () =>
      client.post(
        '/crm/v3/objects/companies',
        { properties: proprietes },
        { headers: enTetesAuth() }
      ),
    `upsertCompany:create(${domain})`
  );
  logger.info(`[hubspot] Entreprise créée (id=${reponse.data.id}, domaine=${domain}).`);
  return reponse.data;
}

/**
 * Crée une association entre deux objets HubSpot.
 * @param {string} fromType - Type de l'objet source ("contacts", "deals", ...).
 * @param {string} fromId
 * @param {string} toType - Type de l'objet cible.
 * @param {string} toId
 * @param {number} assocTypeId - ID numérique du type d'association HubSpot.
 */
export async function associate(fromType, fromId, toType, toId, assocTypeId) {
  if (!fromId || !toId) {
    logger.warn(`[hubspot] associate() ignoré : fromId ou toId manquant (${fromType}->${toType}).`);
    return null;
  }
  try {
    const reponse = await executerAvecRetry(
      () =>
        client.put(
          `/crm/v4/objects/${fromType}/${fromId}/associations/${toType}/${toId}`,
          [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: assocTypeId }],
          { headers: enTetesAuth() }
        ),
      `associate(${fromType}:${fromId} -> ${toType}:${toId})`
    );
    logger.info(`[hubspot] Association créée : ${fromType}/${fromId} -> ${toType}/${toId} (type ${assocTypeId}).`);
    return reponse.data;
  } catch (erreur) {
    // Une association ratée ne doit pas nécessairement stopper tout le pipeline :
    // on journalise en erreur mais on relance pour laisser l'appelant décider.
    logger.error({ erreur: erreur.message }, `[hubspot] Échec de l'association ${fromType}->${toType}.`);
    throw erreur;
  }
}

/**
 * Fonction générique de création d'objet HubSpot avec associations optionnelles.
 * @param {string} objectType
 * @param {Object} props
 * @param {Array<{toObjectType: string, toObjectId: string, associationTypeId: number}>} associations
 */
async function creerObjet(objectType, props, associations = []) {
  const body = { properties: props };

  if (associations.length > 0) {
    body.associations = associations.map((a) => ({
      to: { id: a.toObjectId },
      types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: a.associationTypeId }],
    }));
  }

  const reponse = await executerAvecRetry(
    () => client.post(`/crm/v3/objects/${objectType}`, body, { headers: enTetesAuth() }),
    `creerObjet(${objectType})`
  );
  logger.info(`[hubspot] Objet "${objectType}" créé (id=${reponse.data.id}).`);
  return reponse.data;
}

/** Crée un Lead HubSpot. */
export async function createLead(props, associations = []) {
  return creerObjet('leads', props, associations);
}

/** Crée un Deal HubSpot. */
export async function createDeal(props, associations = []) {
  return creerObjet('deals', props, associations);
}

/** Crée un Ticket HubSpot. */
export async function createTicket(props, associations = []) {
  return creerObjet('tickets', props, associations);
}

/** Crée une tâche HubSpot (objet "tasks"). */
export async function createTask(props, associations = []) {
  return creerObjet('tasks', props, associations);
}

/**
 * Récupère un objet HubSpot par son ID, avec la liste de propriétés demandées.
 * Utilisé notamment par les webhooks HubSpot (qui ne transmettent que la
 * propriété modifiée) pour relire le contexte complet de l'objet.
 *
 * @param {string} objectType - "leads", "deals", "tickets", "contacts", ...
 * @param {string} objectId
 * @param {string[]} proprietes - Liste des noms de propriétés à récupérer.
 */
export async function getById(objectType, objectId, proprietes = []) {
  try {
    const reponse = await executerAvecRetry(
      () =>
        client.get(`/crm/v3/objects/${objectType}/${objectId}`, {
          headers: enTetesAuth(),
          params: proprietes.length ? { properties: proprietes.join(',') } : undefined,
        }),
      `getById(${objectType}, ${objectId})`
    );
    return reponse.data;
  } catch (erreur) {
    logger.error(
      { erreur: erreur.message, objectType, objectId },
      `[hubspot] Échec de la lecture de l'objet ${objectType}/${objectId}.`
    );
    throw erreur;
  }
}

/** Raccourci pour relire un Lead par ID avec toutes les propriétés BlackWay pertinentes. */
export async function executerRequeteLead(leadId) {
  return getById('leads', leadId, [
    'hs_lead_name',
    'bw_forfait',
    'bw_source',
    'bw_lead_score',
  ]);
}

/** Raccourci pour relire un Deal par ID avec toutes les propriétés BlackWay pertinentes. */
export async function executerRequeteDeal(dealId) {
  return getById('deals', dealId, ['dealname', 'bw_forfait', 'bw_source', 'amount']);
}

/**
 * Récupère les pipelines existants pour un type d'objet HubSpot.
 * @param {string} objectType - "deals", "tickets", "leads" (0-136), etc.
 */
export async function getPipelines(objectType) {
  try {
    const reponse = await executerAvecRetry(
      () => client.get(`/crm/v3/pipelines/${objectType}`, { headers: enTetesAuth() }),
      `getPipelines(${objectType})`
    );
    return reponse.data?.results || [];
  } catch (erreur) {
    logger.error({ erreur: erreur.message }, `[hubspot] Impossible de récupérer les pipelines pour "${objectType}".`);
    throw erreur;
  }
}

export default {
  upsertContact,
  upsertCompany,
  createLead,
  createDeal,
  createTicket,
  createTask,
  searchByEmail,
  associate,
  getById,
  executerRequeteLead,
  executerRequeteDeal,
  getPipelines,
  ErreurHubSpot,
};
