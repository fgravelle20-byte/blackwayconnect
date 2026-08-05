/**
 * routes/forms.js
 * ------------------------------------------------------------------
 * Réception des soumissions du formulaire de contact du site
 * BlackWayConnect.
 *
 * Pipeline :
 *   1. Validation stricte du corps de requête avec zod
 *   2. Upsert Contact + Company (si domaine déductible du courriel
 *      ou fourni explicitement)
 *   3. Calcul du score de qualification (scoring.js)
 *   4. Création d'un Lead au stage "New" avec bw_source="Form Web"
 *   5. Création d'une tâche de suivi HubSpot avec échéance selon la
 *      priorité : P1 => 2h, P2 => 24h, P3 => 72h
 *   6. Notification Slack #blackway-leads
 * ------------------------------------------------------------------
 */

import express from 'express';
import { z } from 'zod';
import { config, PROPRIETES_BW } from '../config.js';
import { logger } from '../logger.js';
import * as hubspot from '../hubspot.js';
import { calculerLeadScore, classerPriorite } from '../scoring.js';
import { envoiSlack, blocsNouveauLead } from '../notify.js';

export const routeurForms = express.Router();

/** Schéma de validation zod de la soumission de formulaire. */
const schemaSoumissionFormulaire = z.object({
  nom: z.string().min(1, 'Le nom est requis.'),
  courriel: z.string().email('Le courriel est invalide.'),
  entreprise: z.string().optional().default(''),
  telephone: z.string().optional().default(''),
  forfait_souhaite: z.string().optional().default('Autre'),
  budget: z.union([z.number(), z.string()]).optional().default(0),
  urgence: z.enum(['Élevée', 'Normal', 'Faible']).optional().default('Normal'),
  message: z.string().optional().default(''),
  source: z.string().optional().default('Form Web'),
});

/** Délai de suivi (en heures) selon la priorité commerciale. */
const DELAI_SUIVI_HEURES = { P1: 2, P2: 24, P3: 72 };

/** Déduit un domaine d'entreprise à partir d'un courriel (heuristique simple). */
function deduireDomaineDepuisCourriel(courriel) {
  const domainesPublics = new Set([
    'gmail.com',
    'hotmail.com',
    'outlook.com',
    'yahoo.com',
    'icloud.com',
    'live.com',
  ]);
  const domaine = courriel.split('@')[1]?.toLowerCase();
  if (!domaine || domainesPublics.has(domaine)) return null;
  return domaine;
}

routeurForms.post('/webhook/form', async (req, res) => {
  // --- 1. Validation zod ---
  const resultatValidation = schemaSoumissionFormulaire.safeParse(req.body);
  if (!resultatValidation.success) {
    logger.warn(
      { erreurs: resultatValidation.error.flatten() },
      '[forms] Soumission de formulaire invalide.'
    );
    return res.status(400).json({
      erreur: 'Soumission invalide.',
      details: resultatValidation.error.flatten(),
    });
  }

  const donnees = resultatValidation.data;
  const budgetNum = Number(donnees.budget) || 0;

  try {
    // --- 2. Upsert Contact + Company ---
    const contact = await hubspot.upsertContact(donnees.courriel, {
      firstname: donnees.nom,
      phone: donnees.telephone,
      company: donnees.entreprise,
      [PROPRIETES_BW.contact.forfait]: donnees.forfait_souhaite,
      [PROPRIETES_BW.contact.source]: donnees.source || 'Form Web',
      [PROPRIETES_BW.contact.budgetEstime]: budgetNum,
      [PROPRIETES_BW.contact.urgence]: donnees.urgence,
      lifecyclestage: 'lead',
    });

    const domaine = deduireDomaineDepuisCourriel(donnees.courriel);
    let company = null;
    if (domaine) {
      company = await hubspot.upsertCompany(domaine, { name: donnees.entreprise || domaine });
    }

    // --- 3. Calcul du score ---
    const score = calculerLeadScore({
      icp: Boolean(domaine), // Heuristique simple : un domaine d'entreprise dédié suggère un ICP B2B.
      budget: budgetNum,
      source: donnees.source || 'Form Web',
      urgence: donnees.urgence,
      forfait: donnees.forfait_souhaite,
    });
    const priorite = classerPriorite(score);

    // Mise à jour du score sur le contact
    await hubspot.upsertContact(donnees.courriel, {
      [PROPRIETES_BW.contact.leadScore]: score,
      [PROPRIETES_BW.contact.icp]: domaine ? 'oui' : 'non',
    });

    // --- 4. Création du Lead ---
    const associationsLead = [];
    if (contact?.id) {
      associationsLead.push({ toObjectId: contact.id, associationTypeId: 578 });
    }
    if (company?.id) {
      associationsLead.push({ toObjectId: company.id, associationTypeId: 610 });
    }

    const lead = await hubspot.createLead(
      {
        hs_lead_name: donnees.nom,
        hs_lead_type: 'FORMULAIRE_WEB',
        [PROPRIETES_BW.contact.source]: 'Form Web',
        [PROPRIETES_BW.contact.leadScore]: score,
      },
      associationsLead
    );

    // --- 5. Tâche de suivi HubSpot ---
    const delaiHeures = DELAI_SUIVI_HEURES[priorite];
    const echeance = new Date(Date.now() + delaiHeures * 60 * 60 * 1000);

    const tache = await hubspot.createTask(
      {
        hs_task_subject: `Suivi lead (${priorite}) — ${donnees.nom}`,
        hs_task_body: `Message du client :\n${donnees.message || '(aucun message)'}\n\nForfait souhaité: ${donnees.forfait_souhaite}\nBudget estimé: ${budgetNum} $ CAD\nScore: ${score}/100`,
        hs_task_status: 'NOT_STARTED',
        hs_task_priority: priorite === 'P1' ? 'HIGH' : priorite === 'P2' ? 'MEDIUM' : 'LOW',
        hs_timestamp: echeance.getTime(),
      },
      contact?.id ? [{ toObjectId: contact.id, associationTypeId: 204 /* task -> contact */ }] : []
    );

    // --- 6. Notification Slack ---
    await envoiSlack(
      config.slack.leads,
      blocsNouveauLead({
        nom: donnees.nom,
        courriel: donnees.courriel,
        entreprise: donnees.entreprise,
        forfait: donnees.forfait_souhaite,
        budget: budgetNum,
        source: donnees.source || 'Form Web',
        score,
        priorite,
      }),
      `Nouveau lead Form Web : ${donnees.nom} (${priorite}, score ${score})`
    );

    logger.info(
      `[forms] Lead traité avec succès : ${donnees.nom} (${donnees.courriel}), score=${score}, priorite=${priorite}.`
    );

    return res.status(201).json({
      succes: true,
      score,
      priorite,
      leadId: lead?.id || null,
      contactId: contact?.id || null,
      tacheId: tache?.id || null,
      echeanceSuivi: echeance.toISOString(),
    });
  } catch (erreur) {
    logger.error(
      { erreur: erreur.message },
      `[forms] Échec du traitement de la soumission de formulaire pour ${donnees.courriel}.`
    );
    return res.status(502).json({
      erreur: 'Échec du traitement du lead. Veuillez réessayer ou contacter le support.',
    });
  }
});

export default routeurForms;
