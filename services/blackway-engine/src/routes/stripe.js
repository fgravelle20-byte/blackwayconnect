/**
 * routes/stripe.js
 * ------------------------------------------------------------------
 * Webhook Stripe pour le BlackWay Lead Engine.
 *
 * Événements gérés :
 *  - checkout.session.completed
 *  - payment_intent.succeeded
 *  - invoice.paid
 *
 * Pipeline exécuté pour chaque événement de paiement pertinent :
 *   1. Upsert du Contact HubSpot (bw_forfait_paye, bw_stripe_customer_id,
 *      bw_source="Stripe", lifecyclestage)
 *   2. Création d'un Lead (stage New, score élevé car source=Stripe)
 *   3. Création d'un Deal dans BW_DEAL_PIPELINE_ID au stage "Payé"
 *      avec le montant réel payé
 *   4. Création d'un Ticket Delivery au stage "Brief"
 *   5. Création du projet Asana de livraison
 *   6. Notification Slack #blackway-wins et #blackway-delivery
 *
 * Idempotence :
 *   Le endpoint utilise l'ID d'événement Stripe (evt.id) comme clé
 *   d'idempotence, stockée dans un Set en mémoire. C'est SUFFISANT
 *   pour une seule instance de processus, mais ⚠️ EN PRODUCTION avec
 *   plusieurs instances/replicas, il faut remplacer ce Set par un
 *   store partagé (Redis, avec une clé "stripe_event:<id>" et un TTL,
 *   ex: `SET NX EX 86400`). Voir le README pour plus de détails.
 * ------------------------------------------------------------------
 */

import express from 'express';
import Stripe from 'stripe';
import { config, PRIX, DEAL_STAGES, TICKET_STAGES, PROPRIETES_BW } from '../config.js';
import { logger } from '../logger.js';
import * as hubspot from '../hubspot.js';
import { calculerLeadScore } from '../scoring.js';
import { creerProjetLivraison } from '../asana.js';
import { envoiSlack, blocsDealGagne, blocsTicketDelivery } from '../notify.js';

export const routeurStripe = express.Router();

const stripe = new Stripe(config.stripe.secretKey || 'sk_test_placeholder_non_valide', {
  apiVersion: '2024-06-20',
});

// ⚠️ Store d'idempotence EN MÉMOIRE — voir la note ci-dessus pour la prod.
const evenementsTraites = new Set();

/**
 * Extrait courriel, nom et informations utiles d'un événement Stripe,
 * quel que soit son type exact, de façon défensive.
 */
function extraireInfosClient(event) {
  const objet = event.data.object;

  const courriel =
    objet.customer_details?.email ||
    objet.customer_email ||
    objet.receipt_email ||
    objet.billing_details?.email ||
    null;

  const nom =
    objet.customer_details?.name ||
    objet.shipping?.name ||
    objet.billing_details?.name ||
    'Client Stripe';

  const stripeCustomerId =
    typeof objet.customer === 'string' ? objet.customer : objet.customer?.id || null;

  // Montant en cents -> dollars. checkout.session utilise amount_total,
  // payment_intent utilise amount_received, invoice utilise amount_paid.
  const montantCents =
    objet.amount_total ?? objet.amount_received ?? objet.amount_paid ?? objet.amount ?? 0;
  const montant = montantCents ? Math.round(montantCents) / 100 : 0;

  // Le forfait acheté est déduit des métadonnées Stripe si présentes
  // (à renseigner côté site/Checkout via `metadata.forfait`).
  const forfait = objet.metadata?.forfait || 'Autre';

  return { courriel, nom, stripeCustomerId, montant, forfait };
}

/**
 * Exécute le pipeline complet "paiement Stripe reçu" pour un client.
 */
async function traiterPaiementReussi({ courriel, nom, stripeCustomerId, montant, forfait, eventId }) {
  if (!courriel) {
    logger.warn(
      `[stripe] Événement ${eventId} sans courriel exploitable — pipeline HubSpot ignoré.`
    );
    return;
  }

  // 1. Upsert Contact
  const contact = await hubspot.upsertContact(courriel, {
    firstname: nom,
    [PROPRIETES_BW.contact.forfaitPaye]: forfait,
    [PROPRIETES_BW.contact.stripeCustomerId]: stripeCustomerId || '',
    [PROPRIETES_BW.contact.source]: 'Stripe',
    lifecyclestage: 'customer',
  });

  // 2. Score élevé car la source est Stripe (paiement déjà effectué)
  const score = calculerLeadScore({ icp: true, budget: montant, source: 'Stripe', urgence: 'Élevée' });

  // 3. Création du Lead
  const lead = await hubspot.createLead(
    {
      hs_lead_name: nom,
      hs_lead_type: 'CLIENT_PAYANT',
      [PROPRIETES_BW.contact.leadScore]: score,
      [PROPRIETES_BW.contact.source]: 'Stripe',
    },
    contact?.id
      ? [{ toObjectId: contact.id, associationTypeId: 578 /* lead -> contact (primary) */ }]
      : []
  );

  // 4. Création du Deal au stage "Payé"
  const deal = await hubspot.createDeal(
    {
      dealname: `${nom} — ${forfait}`,
      pipeline: config.pipelines.dealPipelineId,
      dealstage: DEAL_STAGES.PAYE,
      amount: montant,
      [PROPRIETES_BW.deal.forfait]: forfait,
      [PROPRIETES_BW.deal.source]: 'Stripe',
      [PROPRIETES_BW.deal.leadScore]: score,
    },
    contact?.id ? [{ toObjectId: contact.id, associationTypeId: 3 /* deal -> contact */ }] : []
  );

  // 5. Création du Ticket Delivery au stage "Brief"
  const ticket = await hubspot.createTicket(
    {
      subject: `Livraison — ${nom} (${forfait})`,
      content: `Ticket de livraison généré automatiquement après paiement Stripe. Deal HubSpot: ${deal?.id || 'N/D'}.`,
      hs_pipeline: config.pipelines.ticketPipelineId,
      hs_pipeline_stage: TICKET_STAGES.BRIEF,
      [PROPRIETES_BW.ticket.forfait]: forfait,
      [PROPRIETES_BW.ticket.dealLie]: deal?.id || '',
    },
    contact?.id ? [{ toObjectId: contact.id, associationTypeId: 16 /* ticket -> contact */ }] : []
  );

  // 6. Création du projet Asana de livraison
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 14); // Échéance par défaut : 14 jours.
  const projetAsana = await creerProjetLivraison({
    nomClient: nom,
    forfait,
    dealId: deal?.id,
    deadline,
  });

  // 7. Notifications Slack
  await envoiSlack(
    config.slack.deals,
    blocsDealGagne({ nomClient: nom, forfait, montant, dealId: deal?.id }),
    `Deal gagné : ${nom} — ${forfait} (${montant} $ CAD)`
  );
  await envoiSlack(
    config.slack.delivery,
    blocsTicketDelivery({ nomClient: nom, forfait, ticketId: ticket?.id, projetAsanaUrl: projetAsana?.url }),
    `Nouveau ticket de livraison : ${nom} — ${forfait}`
  );

  logger.info(
    `[stripe] Pipeline Stripe→HubSpot→Asana→Slack terminé pour "${nom}" (courriel=${courriel}, deal=${deal?.id}).`
  );
}

/**
 * Handler du endpoint webhook Stripe.
 * IMPORTANT : ce endpoint doit recevoir le corps BRUT (raw) de la requête
 * pour permettre la vérification de signature — voir server.js.
 */
routeurStripe.post('/webhook/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    if (!config.stripe.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET non configuré côté serveur.');
    }
    event = stripe.webhooks.constructEvent(req.body, signature, config.stripe.webhookSecret);
  } catch (erreur) {
    logger.error({ erreur: erreur.message }, '[stripe] Signature de webhook invalide.');
    return res.status(400).send(`Signature de webhook invalide: ${erreur.message}`);
  }

  // --- Idempotence ---
  if (evenementsTraites.has(event.id)) {
    logger.info(`[stripe] Événement ${event.id} déjà traité — réponse 200 sans retraitement.`);
    return res.status(200).json({ recu: true, dejaTraite: true });
  }

  // Répondre rapidement à Stripe (bonne pratique), puis traiter en tâche de fond.
  res.status(200).json({ recu: true });

  try {
    const typesGeres = ['checkout.session.completed', 'payment_intent.succeeded', 'invoice.paid'];
    if (!typesGeres.includes(event.type)) {
      logger.info(`[stripe] Type d'événement "${event.type}" ignoré (non pertinent pour le pipeline).`);
      return;
    }

    const infos = extraireInfosClient(event);
    logger.info({ type: event.type, eventId: event.id }, `[stripe] Traitement de l'événement Stripe.`);

    await traiterPaiementReussi({ ...infos, eventId: event.id });

    // Marquer comme traité seulement après succès complet du pipeline.
    evenementsTraites.add(event.id);
  } catch (erreur) {
    logger.error(
      { erreur: erreur.message, eventId: event.id },
      '[stripe] Échec du traitement du pipeline post-paiement.'
    );
    // Ne pas ajouter l'event à evenementsTraites : un retry Stripe (nouvelle
    // livraison du même event.id) pourra retenter le pipeline complet.
  }
});

export default routeurStripe;
