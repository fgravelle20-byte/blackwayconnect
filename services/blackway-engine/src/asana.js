/**
 * asana.js
 * ------------------------------------------------------------------
 * Création automatique du projet de livraison Asana lorsqu'un deal
 * BlackWayConnect est marqué "Payé".
 *
 * Si un GID de modèle de projet (ASANA_PROJECT_TEMPLATE_GID) est
 * fourni, on instancie ce modèle. Sinon, on crée un projet simple
 * et on y ajoute les tâches standard définies dans CHECKLISTS
 * (src/config.js) selon le forfait vendu.
 * ------------------------------------------------------------------
 */

import axios from 'axios';
import { config, CHECKLISTS } from './config.js';
import { logger } from './logger.js';

const ASANA_BASE_URL = 'https://app.asana.com/api/1.0';

function enTetesAuth() {
  if (!config.asana.token) {
    logger.warn('[asana] ASANA_TOKEN est absent — les appels Asana échoueront.');
  }
  return {
    Authorization: `Bearer ${config.asana.token}`,
    'Content-Type': 'application/json',
  };
}

const client = axios.create({ baseURL: ASANA_BASE_URL, timeout: 15000 });

/**
 * Instancie un projet à partir d'un modèle Asana (project template).
 * @param {string} templateGid
 * @param {string} nomProjet
 * @param {string} workspaceGid
 */
async function instancierDepuisModele(templateGid, nomProjet, workspaceGid) {
  const reponse = await client.post(
    `/project_templates/${templateGid}/instantiateProject`,
    {
      data: {
        name: nomProjet,
        team: workspaceGid, // Dans certains comptes, un "team" GID est requis plutôt qu'un workspace.
        is_strict: false,
      },
    },
    { headers: enTetesAuth() }
  );
  // L'instanciation à partir d'un modèle est asynchrone côté Asana :
  // elle renvoie un "job". On retourne l'info du job pour traçabilité.
  return reponse.data?.data;
}

/**
 * Crée un projet Asana simple (sans modèle).
 * @param {string} nomProjet
 * @param {string} workspaceGid
 */
async function creerProjetSimple(nomProjet, workspaceGid) {
  const reponse = await client.post(
    '/projects',
    {
      data: {
        name: nomProjet,
        workspace: workspaceGid,
        notes: 'Projet de livraison créé automatiquement par le BlackWay Lead Engine.',
      },
    },
    { headers: enTetesAuth() }
  );
  return reponse.data?.data;
}

/**
 * Ajoute une liste de tâches standard à un projet Asana donné.
 * @param {string} projectGid
 * @param {string[]} taches
 * @param {string} workspaceGid
 */
async function ajouterTachesStandard(projectGid, taches, workspaceGid) {
  const tachesCreees = [];
  for (const nomTache of taches) {
    try {
      const reponse = await client.post(
        '/tasks',
        {
          data: {
            name: nomTache,
            projects: [projectGid],
            workspace: workspaceGid,
          },
        },
        { headers: enTetesAuth() }
      );
      tachesCreees.push(reponse.data?.data);
    } catch (erreur) {
      logger.error(
        { erreur: erreur?.response?.data || erreur.message, nomTache },
        `[asana] Échec de la création de la tâche "${nomTache}" — poursuite avec les tâches restantes.`
      );
    }
  }
  return tachesCreees;
}

/**
 * Crée le projet de livraison Asana pour un client BlackWayConnect.
 *
 * @param {Object} params
 * @param {string} params.nomClient
 * @param {string} params.forfait - Doit correspondre à une clé de CHECKLISTS.
 * @param {string} params.dealId - ID du deal HubSpot associé (traçabilité).
 * @param {string|Date} [params.deadline] - Échéance visée pour la livraison.
 * @returns {Promise<{ gid: string, url: string, viaModele: boolean } | null>}
 */
export async function creerProjetLivraison({ nomClient, forfait, dealId, deadline }) {
  if (!config.asana.token || !config.asana.workspaceGid) {
    logger.warn(
      '[asana] ASANA_TOKEN ou ASANA_WORKSPACE_GID manquant — création du projet de livraison ignorée.'
    );
    return null;
  }

  const dateStr = deadline ? new Date(deadline).toISOString().slice(0, 10) : 'sans échéance';
  const nomProjet = `Livraison BlackWay — ${nomClient || 'Client inconnu'} (${forfait || 'Forfait N/D'}, échéance ${dateStr})`;

  try {
    let projet;
    let viaModele = false;

    if (config.asana.projectTemplateGid) {
      logger.info(`[asana] Instanciation du projet "${nomProjet}" depuis le modèle configuré.`);
      const job = await instancierDepuisModele(
        config.asana.projectTemplateGid,
        nomProjet,
        config.asana.workspaceGid
      );
      viaModele = true;
      // Le job Asana ne contient pas toujours le GID final du projet immédiatement
      // (le traitement est asynchrone côté Asana). On journalise le job créé.
      logger.info({ job }, '[asana] Job d\u2019instanciation de modèle créé.');
      projet = job?.new_project || job;
    } else {
      logger.info(`[asana] Création simple du projet "${nomProjet}" (aucun modèle configuré).`);
      projet = await creerProjetSimple(nomProjet, config.asana.workspaceGid);

      const taches = CHECKLISTS[forfait] || CHECKLISTS.Autre;
      await ajouterTachesStandard(projet.gid, taches, config.asana.workspaceGid);
    }

    const projetGid = projet?.gid;
    const projetUrl = projetGid ? `https://app.asana.com/0/${projetGid}` : null;

    logger.info(
      `[asana] Projet de livraison créé pour "${nomClient}" (deal=${dealId || 'N/D'}, gid=${projetGid || 'inconnu'}).`
    );

    return { gid: projetGid, url: projetUrl, viaModele };
  } catch (erreur) {
    logger.error(
      { erreur: erreur?.response?.data || erreur.message },
      `[asana] Échec de la création du projet de livraison pour "${nomClient}".`
    );
    // On ne relance pas l'erreur : l'échec Asana ne doit pas bloquer le reste
    // du pipeline (Deal / Ticket / Slack ont déjà pu être créés).
    return null;
  }
}

export default { creerProjetLivraison };
