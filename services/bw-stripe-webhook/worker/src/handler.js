import { CATALOGUE, HUBSPOT, PRICE_INDEX, normaliserForfait } from './config.js';
import { clientHubSpot } from './hubspot.js';
import { listLineItems } from './stripe.js';

const DOMAINES_PERSO = new Set([
  'gmail.com', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'yahoo.com', 'yahoo.fr',
  'icloud.com', 'me.com', 'live.ca', 'live.com', 'videotron.ca', 'sympatico.ca',
  'privaterelay.appleid.com', 'proton.me', 'protonmail.com',
]);

export function resoudreForfait({ metadata = {}, lineItems = [] }) {
  const viaMeta = normaliserForfait(metadata.bw_forfait);
  if (viaMeta) return viaMeta;
  for (const item of lineItems) {
    const viaPriceMeta = normaliserForfait(item?.price?.metadata?.bw_forfait);
    if (viaPriceMeta) return viaPriceMeta;
    const viaProdMeta = normaliserForfait(item?.price?.product?.metadata?.bw_forfait);
    if (viaProdMeta) return viaProdMeta;
    const byPrice = PRICE_INDEX[item?.price?.id];
    if (byPrice) return byPrice;
    const nom = (item?.description || item?.price?.product?.name || '')
      .replace(/^BlackWayConnect\s*[—-]\s*/i, '').trim();
    const viaNom = normaliserForfait(nom);
    if (viaNom) return viaNom;
  }
  return null;
}

export function calculerScore(forfaitCle, session) {
  const c = CATALOGUE[forfaitCle];
  let score = c ? c.scoreBase : 60;
  if (session.mode === 'subscription') score += 5;
  if ((session.amount_total || 0) / 100 >= 4000) score += 5;
  const d = (session.customer_details?.email || '').split('@')[1]?.toLowerCase();
  if (d && !DOMAINES_PERSO.has(d)) score += 5;
  return Math.max(0, Math.min(100, score));
}

function domainePro(email) {
  const d = email?.split('@')[1]?.toLowerCase();
  return !d || DOMAINES_PERSO.has(d) ? null : d;
}

function dateEcheance(jours) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + jours);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

async function alerteSlack(url, { forfait, montant, devise, email, nom, dealId }) {
  if (!url) return;
  const dealUrl = `https://app.hubspot.com/contacts/${HUBSPOT.portalId}/deal/${dealId}`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `Nouveau paiement BlackWay : ${forfait} — ${montant} ${devise}`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: `Paiement reçu — ${montant} ${devise}` } },
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
      }),
    });
  } catch { /* jamais bloquant */ }
}

export async function traiterPaiement(event, env, log = console.log) {
  const session = event.data.object;
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return { skipped: 'unpaid' };
  }

  const hub = clientHubSpot(env.HUBSPOT_TOKEN, log);

  let lineItems = [];
  try {
    lineItems = await listLineItems(session.id, env.STRIPE_SECRET_KEY);
  } catch (e) {
    log(JSON.stringify({ level: 'warn', msg: 'line items non recuperes', err: String(e).slice(0, 200) }));
  }

  const forfaitCle = resoudreForfait({ metadata: session.metadata || {}, lineItems });
  const cat = forfaitCle ? CATALOGUE[forfaitCle] : null;

  const email = session.customer_details?.email || session.customer_email;
  if (!email) return { skipped: 'no_email' };

  const paymentId = String(session.payment_intent || session.subscription || session.id);

  const existant = await hub.findDealByStripeId(paymentId);
  if (existant) return { skipped: 'duplicate', dealId: existant };

  const nomComplet = session.customer_details?.name || '';
  const [prenom, ...reste] = nomComplet.split(' ');
  const montant = (session.amount_total || 0) / 100;
  const devise = (session.currency || 'cad').toUpperCase();
  const score = calculerScore(forfaitCle, session);
  const urgence = montant >= 4995 ? 'elevee' : montant >= 1000 ? 'normal' : 'faible';

  const { id: contactId, created } = await hub.upsertContact(email, {
    firstname: prenom || undefined,
    lastname: reste.length ? reste.join(' ') : undefined,
    phone: session.customer_details?.phone || undefined,
    lifecyclestage: 'customer',
    bw_source: 'stripe',
    bw_forfait: cat?.hubspot,
    bw_forfait_paye: cat?.hubspot,
    bw_lead_score: score,
    bw_urgence: urgence,
    bw_budget_estime: montant,
  });

  const domaine = domainePro(email);
  const companyId = domaine ? await hub.upsertCompany(domaine, domaine) : null;
  const libelleClient = domaine || nomComplet || email;

  const dealId = await hub.createDeal({
    dealname: `${libelleClient} – ${forfaitCle || 'Forfait BlackWay'}`,
    pipeline: HUBSPOT.pipelineId,
    dealstage: HUBSPOT.stages.paiement_recu,
    amount: String(montant),
    closedate: String(Date.now()),
    bw_forfait: cat?.hubspot,
    bw_source: 'stripe',
    bw_segment: domaine ? 'Entreprise' : 'Particulier / TPE',
    bw_lead_score: score,
    bw_urgence: urgence,
    bw_stripe_payment_id: paymentId,
    bw_livraison_statut: 'non_demarre',
    bw_deadline: String(dateEcheance(cat?.delaiJours ?? 14)),
  });

  await hub.associate('deals', dealId, 'contacts', contactId, HUBSPOT.assoc.dealToContact);
  if (companyId) await hub.associate('deals', dealId, 'companies', companyId, HUBSPOT.assoc.dealToCompany);

  const lignes = lineItems
    .map((i) => `• ${i.description} × ${i.quantity} — ${(i.amount_total / 100).toFixed(2)} ${devise}`)
    .join('<br>');

  await hub.createNote(
    dealId,
    contactId,
    [
      '<b>Paiement Stripe encaissé</b>',
      `Forfait : ${forfaitCle || 'non reconnu'}`,
      `Montant : ${montant.toFixed(2)} ${devise}`,
      `Mode : ${session.mode === 'subscription' ? 'Abonnement récurrent' : 'Paiement unique'}`,
      `Session : ${session.id}`,
      `Référence : ${paymentId}`,
      `Lead score : ${score}/100`,
      lignes ? `<br>${lignes}` : '',
    ].filter(Boolean).join('<br>')
  );

  const ticketId = await hub.createDeliveryTicket(
    {
      subject: `Livraison – ${forfaitCle || 'Forfait BlackWay'} – ${libelleClient}`,
      content: `Déclenché automatiquement par le paiement Stripe ${paymentId}. Délai cible : ${cat?.delaiJours ?? 14} jours.`,
      hs_ticket_priority: urgence === 'elevee' ? 'HIGH' : 'MEDIUM',
    },
    dealId,
    contactId
  );

  await alerteSlack(env.SLACK_WEBHOOK_URL, {
    forfait: forfaitCle || 'Forfait non reconnu',
    montant: montant.toFixed(2),
    devise, email, nom: nomComplet, dealId,
  });

  const resultat = { contactId, contactCree: created, companyId, dealId, ticketId, forfait: forfaitCle, montant, score };
  log(JSON.stringify({ level: 'info', msg: 'chaine completee', ...resultat }));
  return resultat;
}
