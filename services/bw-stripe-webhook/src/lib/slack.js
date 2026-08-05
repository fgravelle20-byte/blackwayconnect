import { ENV } from '../config.js';
import { log } from './logger.js';

/** Alerte Slack temps reel. Ne doit jamais faire echouer le webhook. */
export async function alerteVente({ forfait, montant, devise, email, nom, dealId, portalId }) {
  if (!ENV.slackWebhookUrl) return;
  const dealUrl = `https://app.hubspot.com/contacts/${portalId}/deal/${dealId}`;
  const payload = {
    text: `Nouveau paiement BlackWay : ${forfait} — ${montant} ${devise}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `Paiement reçu — ${montant} ${devise}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Forfait*\n${forfait}` },
          { type: 'mrkdwn', text: `*Client*\n${nom || '—'}` },
          { type: 'mrkdwn', text: `*Courriel*\n${email}` },
          { type: 'mrkdwn', text: `*Deal HubSpot*\n<${dealUrl}|Ouvrir la fiche>` },
        ],
      },
    ],
  };
  try {
    await fetch(ENV.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    log.warn('alerte Slack echouee', { err: String(e).slice(0, 200) });
  }
}
