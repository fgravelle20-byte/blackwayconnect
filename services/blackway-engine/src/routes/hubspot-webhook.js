/**
 * routes/hubspot-webhook.js
 * ------------------------------------------------------------------
 * Réception des webhooks HubSpot (abonnements aux changements de
 * propriétés / d'étape de pipeline).
 *
 * Règles métier :
 *  - Si un Lead passe au stage "Qualified"
 *      => création d'un Deal associé dans BW_DEAL_PIPELINE_ID au
 *         stage "Diagnostic", avec le montant du forfait (table PRIX)
 *      => création d'une tâche "Préparer proposition BlackWay"
 *
 *  - Si un Deal passe au stage "Payé"
 *      => création du Ticket Delivery (stage "Brief")
 *      => création du projet Asana de livraison
 *      => notification Slack
 *
 * HubSpot envoie un tableau d'événements dans le corps de la requête.
 * Chaque événement contient au minimum : subscriptionType, objectId,
 * propertyName, propertyValue.
 * ------------------------------------------------------------------
 */

import express from 'express';
import { config, PRIX, DEAL_STAGES, TICKET_STAGES, LEAD_STAGES, PROPRIETES_BW } from '../config.js';
import { logger } from '../logger.js';
import * as hubspot from '../hubspot.js';
import { creerProjetLivraison } from '../asana.js';
import { envoiSlack, blocsTicketDelivery } from '../notify.js';

export const routeurHubspotWebhook = express.Router();

/**
 * Récupère un objet HubSpot par son ID pour en lire les propriétés
 * nécessaires à la suite du pipeline (nom du contact associé, forfait, etc.).
 * NB: on utilise l'API search par manque d'un "get by id" générique
 * exposé dans hubspot.js ; ici on s'appuie sur les données déjà
 * présentes dans l'événement webhook autant que possible, et on
 * complète via de nouvelles créations plutôt que des lectures
 * supplémentaires, pour rester simple et robuste.
 */

/**
 * Traite un événement de changement de propriété sur un Lead.
 * @param {Object} evenement - Événement webhook HubSpot brut.
 */
async function traiterChangementLead(evenement) {
  const leadId = String(evenement.objectId);
  const nouvelleValeur = evenement.propertyValue;

  if (nouvelleValeur !== LEAD_STAGES.QUALIFIED) {
    logger.info(`[hubspot-webhook] Lead ${leadId} a changé de stage vers "${nouvelleValeur}" (ignoré, seul "Qualified" déclenche une action).`);
    return;
  }

  logger.info(`[hubspot-webhook] Lead ${leadId} qualifié — création du Deal associé.`);

  // Le forfait et le nom du client sont normalement disponibles via les
  // propriétés du Lead. HubSpot n'envoie que la propriété modifiée dans le
  // webhook ; en environnement réel, on ferait un GET sur le Lead pour lire
  // bw_forfait, bw_source, etc. On modélise cette lecture ici.
  let forfait = 'Autre';
  let leadName = `Lead ${leadId}`;
  let leadScore = 0;

  try {
    const detailsLead = await hubspot.executerRequeteLead(leadId);
    if (detailsLead) {
      forfait = detailsLead.properties?.[PROPRIETES_BW.contact.forfait] || forfait;
      leadName = detailsLead.properties?.hs_lead_name || leadName;
      leadScore = Number(detailsLead.properties?.[PROPRIETES_BW.contact.leadScore]) || 0;
    }
  } catch {
    // Lecture optionnelle : si elle échoue, on continue avec les valeurs par défaut.
    logger.warn(`[hubspot-webhook] Impossible de relire les détails du Lead ${leadId}, valeurs par défaut utilisées.`);
  }

  const montant = PRIX[forfait] ?? PRIX.Autre;

  const deal = await hubspot.createDeal(
    {
      dealname: `${leadName} — ${forfait}`,
      pipeline: config.pipelines.dealPipelineId,
      dealstage: DEAL_STAGES.DIAGNOSTIC,
      amount: montant,
      [PROPRIETES_BW.deal.forfait]: forfait,
      [PROPRIETES_BW.deal.leadScore]: leadScore,
    },
    [{ toObjectId: leadId, associationTypeId: 578 /* deal <-> lead */ }]
  );

  await hubspot.createTask(
    {
      hs_task_subject: 'Préparer proposition BlackWay',
      hs_task_body: `Le lead "${leadName}" (id=${leadId}) est passé au stage Qualified. Deal créé : ${deal?.id || 'N/D'}. Forfait pressenti : ${forfait} (${montant} $ CAD).`,
      hs_task_status: 'NOT_STARTED',
      hs_task_priority: 'HIGH',
      hs_timestamp: Date.now() + 24 * 60 * 60 * 1000, // Échéance : 24h.
    },
    deal?.id ? [{ toObjectId: deal.id, associationTypeId: 216 /* task -> deal */ }] : []
  );

  logger.info(`[hubspot-webhook] Deal ${deal?.id} créé au stage Diagnostic pour le lead ${leadId}.`);
}

/**
 * Traite un événement de changement de propriété sur un Deal.
 * @param {Object} evenement
 */
async function traiterChangementDeal(evenement) {
  const dealId = String(evenement.objectId);
  const nouvelleValeur = evenement.propertyValue;

  if (nouvelleValeur !== DEAL_STAGES.PAYE) {
    logger.info(`[hubspot-webhook] Deal ${dealId} a changé de stage vers "${nouvelleValeur}" (ignoré, seul "Payé" déclenche une action).`);
    return;
  }

  logger.info(`[hubspot-webhook] Deal ${dealId} marqué Payé — création du Ticket Delivery et du projet Asana.`);

  let forfait = 'Autre';
  let nomClient = `Client (deal ${dealId})`;

  try {
    const detailsDeal = await hubspot.executerRequeteDeal(dealId);
    if (detailsDeal) {
      forfait = detailsDeal.properties?.[PROPRIETES_BW.deal.forfait] || forfait;
      nomClient = detailsDeal.properties?.dealname || nomClient;
    }
  } catch {
    logger.warn(`[hubspot-webhook] Impossible de relire les détails du Deal ${dealId}, valeurs par défaut utilisées.`);
  }

  const ticket = await hubspot.createTicket(
    {
      subject: `Livraison — ${nomClient} (${forfait})`,
      content: `Ticket de livraison généré automatiquement suite au passage du deal ${dealId} au stage "Payé".`,
      hs_pipeline: config.pipelines.ticketPipelineId,
      hs_pipeline_stage: TICKET_STAGES.BRIEF,
      [PROPRIETES_BW.ticket.forfait]: forfait,
      [PROPRIETES_BW.ticket.dealLie]: dealId,
    },
    [{ toObjectId: dealId, associationTypeId: 26 /* ticket -> deal */ }]
  );

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 14);
  const projetAsana = await creerProjetLivraison({ nomClient, forfait, dealId, deadline });

  await envoiSlack(
    config.slack.delivery,
    blocsTicketDelivery({ nomClient, forfait, ticketId: ticket?.id, projetAsanaUrl: projetAsana?.url }),
    `Nouveau ticket de livraison : ${nomClient} — ${forfait}`
  );

  logger.info(`[hubspot-webhook] Ticket ${ticket?.id} créé pour le deal ${dealId}.`);
}

routeurHubspotWebhook.post('/webhook/hubspot', async (req, res) => {
  const evenements = Array.isArray(req.body) ? req.body : [req.body];

  // On répond immédiatement à HubSpot (bonne pratique, évite les retries inutiles),
  // puis on traite chaque événement en tâche de fond.
  res.status(200).json({ recu: true, nbEvenements: evenements.length });

  for (const evenement of evenements) {
    try {
      if (!evenement || !evenement.subscriptionType) {
        logger.warn('[hubspot-webhook] Événement reçu sans subscriptionType — ignoré.');
        continue;
      }

      const estChangementPropriete = evenement.subscriptionType.includes('propertyChange');
      if (!estChangementPropriete) {
        logger.info(`[hubspot-webhook] Type d'abonnement "${evenement.subscriptionType}" non géré — ignoré.`);
        continue;
      }

      const estLead = evenement.subscriptionType.startsWith('lead.');
      const estDeal = evenement.subscriptionType.startsWith('deal.');
      const estStageProperty =
        evenement.propertyName === 'hs_pipeline_stage' || evenement.propertyName === 'dealstage';

      if (estLead && estStageProperty) {
        await traiterChangementLead(evenement);
      } else if (estDeal && estStageProperty) {
        await traiterChangementDeal(evenement);
      } else {
        logger.info(
          `[hubspot-webhook] Événement ignoré (objet=${evenement.subscriptionType}, propriété=${evenement.propertyName}).`
        );
      }
    } catch (erreur) {
      logger.error(
        { erreur: erreur.message, evenement },
        '[hubspot-webhook] Échec du traitement d\u2019un événement webhook HubSpot.'
      );
      // On continue avec les événements suivants du lot même si l'un échoue.
    }
  }
});

export default routeurHubspotWebhook;
