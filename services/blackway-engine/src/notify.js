/**
 * notify.js
 * ------------------------------------------------------------------
 * Envoi de notifications Slack via Incoming Webhooks, avec des
 * générateurs de blocs Block Kit prêts à l'emploi pour les
 * événements métier de BlackWayConnect : nouveau lead, deal gagné,
 * nouveau ticket de livraison.
 *
 * Si l'URL du webhook n'est pas configurée, la fonction ne plante
 * jamais : elle journalise un avertissement et poursuit l'exécution
 * (pour ne jamais bloquer un pipeline métier à cause de Slack).
 * ------------------------------------------------------------------
 */

import axios from 'axios';
import { logger } from './logger.js';

/**
 * Envoie un message Slack formaté en Block Kit vers un webhook donné.
 *
 * @param {string} webhookUrl - URL du webhook Slack (peut être vide/absente).
 * @param {Array<Object>} blocks - Tableau de blocs Block Kit.
 * @param {string} [texteAlternatif] - Texte de repli pour les notifications.
 * @returns {Promise<boolean>} true si l'envoi a réussi, false sinon.
 */
export async function envoiSlack(webhookUrl, blocks, texteAlternatif = 'Notification BlackWay') {
  if (!webhookUrl) {
    logger.warn('[notify] Aucune URL de webhook Slack configurée — notification ignorée.');
    return false;
  }

  try {
    await axios.post(
      webhookUrl,
      { text: texteAlternatif, blocks },
      { timeout: 8000, headers: { 'Content-Type': 'application/json' } }
    );
    logger.info('[notify] Notification Slack envoyée avec succès.');
    return true;
  } catch (erreur) {
    logger.warn(
      { erreur: erreur?.response?.data || erreur.message },
      '[notify] Échec de l\u2019envoi de la notification Slack — poursuite sans interruption.'
    );
    return false;
  }
}

/** Construit les blocs Block Kit pour l'annonce d'un nouveau lead. */
export function blocsNouveauLead({ nom, courriel, entreprise, forfait, budget, source, score, priorite }) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🆕 Nouveau lead BlackWayConnect', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Nom:*\n${nom || 'Inconnu'}` },
        { type: 'mrkdwn', text: `*Courriel:*\n${courriel || 'N/D'}` },
        { type: 'mrkdwn', text: `*Entreprise:*\n${entreprise || 'N/D'}` },
        { type: 'mrkdwn', text: `*Forfait souhaité:*\n${forfait || 'N/D'}` },
        { type: 'mrkdwn', text: `*Budget estimé:*\n${budget ? `${budget} $ CAD` : 'N/D'}` },
        { type: 'mrkdwn', text: `*Source:*\n${source || 'N/D'}` },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Score:* ${score ?? 'N/D'}/100  —  *Priorité:* ${priorite || 'N/D'}` },
    },
  ];
}

/** Construit les blocs Block Kit pour l'annonce d'un deal gagné (payé). */
export function blocsDealGagne({ nomClient, forfait, montant, dealId }) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🎉 Deal gagné — Paiement reçu', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Client:*\n${nomClient || 'N/D'}` },
        { type: 'mrkdwn', text: `*Forfait:*\n${forfait || 'N/D'}` },
        { type: 'mrkdwn', text: `*Montant:*\n${montant ? `${montant} $ CAD` : 'N/D'}` },
        { type: 'mrkdwn', text: `*ID Deal HubSpot:*\n${dealId || 'N/D'}` },
      ],
    },
  ];
}

/** Construit les blocs Block Kit pour l'annonce d'un nouveau ticket de livraison. */
export function blocsTicketDelivery({ nomClient, forfait, ticketId, projetAsanaUrl }) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🚚 Nouveau ticket de livraison', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Client:*\n${nomClient || 'N/D'}` },
        { type: 'mrkdwn', text: `*Forfait:*\n${forfait || 'N/D'}` },
        { type: 'mrkdwn', text: `*ID Ticket HubSpot:*\n${ticketId || 'N/D'}` },
      ],
    },
    ...(projetAsanaUrl
      ? [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `<${projetAsanaUrl}|📋 Voir le projet Asana>` },
          },
        ]
      : []),
  ];
}
