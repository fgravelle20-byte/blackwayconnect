/**
 * Handler : checkout.session.completed
 *
 * Chaine complete :
 *   Paiement Stripe
 *     -> Contact HubSpot (upsert par courriel)
 *     -> Company (si domaine pro detectable)
 *     -> Deal dans « BlackWay – Revenue » au stage « Paiement reçu »
 *     -> Note d'audit avec le detail Stripe
 *     -> Ticket de livraison
 *     -> Alerte Slack
 */
import Stripe from 'stripe';
import { CATALOGUE, ENV, HUBSPOT, PRICE_INDEX, normaliserForfait } from '../config.js';
import {
  associate,
  createDeal,
  createDeliveryTicket,
  createNote,
  findDealByStripeId,
  upsertCompany,
  upsertContact,
} from '../hubspot.js';
import { alerteVente } from '../lib/slack.js';
import { log } from '../lib/logger.js';

const stripe = new Stripe(ENV.stripeSecretKey || 'sk_placeholder', { apiVersion: '2024-06-20' });

const DOMAINES_PERSO = new Set([
  'gmail.com', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'yahoo.com', 'yahoo.fr',
  'icloud.com', 'me.com', 'live.ca', 'live.com', 'videotron.ca', 'sympatico.ca',
  'privaterelay.appleid.com', 'proton.me', 'protonmail.com',
]);

/** Determine le forfait a partir de la metadonnee, du price_id, ou du nom produit. */
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
    const nom = (item?.description || item?.price?.product?.name || '').replace(/^BlackWayConnect\s*[—-]\s*/i, '').trim();
    const viaNom = normaliserForfait(nom);
    if (viaNom) return viaNom;
  }
  return null;
}

/** Score 0-100 : forfait de base + bonus recurrent + bonus montant + bonus courriel pro. */
export function calculerScore(forfaitCle, session) {
  const c = CATALOGUE[forfaitCle];
  let score = c ? c.scoreBase : 60;
  if (session.mode === 'subscription') score += 5;
  const total = (session.amount_total || 0) / 100;
  if (total >= 4000) score += 5;
  const email = session.customer_details?.email || '';
  const domaine = email.split('@')[1]?.toLowerCase();
  if (domaine && !DOMAINES_PERSO.has(domaine)) score += 5;
  return Math.max(0, Math.min(100, score));
}

function domainePro(email) {
  const d = email?.split('@')[1]?.toLowerCase();
  if (!d || DOMAINES_PERSO.has(d)) return null;
  return d;
}

function dateEcheance(jours) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + jours);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime(); // HubSpot attend un timestamp UTC minuit
}

export async function handleCheckoutSessionCompleted(event) {
  const session = event.data.object;

  // 1. Ne traiter que les paiements reellement encaisses.
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    log.info('session ignoree (non payee)', { id: session.id, status: session.payment_status });
    return { skipped: 'unpaid' };
  }

  // 2. Recuperer les line items enrichis (le webhook ne les inclut pas).
  let lineItems = [];
  try {
    const li = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 20,
      expand: ['data.price.product'],
    });
    lineItems = li.data;
  } catch (e) {
    log.warn('line items non recuperes', { err: String(e).slice(0, 200) });
  }

  const forfaitCle = resoudreForfait({ metadata: session.metadata || {}, lineItems });
  const cat = forfaitCle ? CATALOGUE[forfaitCle] : null;
  if (!cat) {
    log.error('forfait non reconnu', { session: session.id, metadata: session.metadata });
  }

  const email = session.customer_details?.email || session.customer_email;
  if (!email) {
    log.error('aucun courriel dans la session', { session: session.id });
    return { skipped: 'no_email' };
  }

  const paymentId = session.payment_intent || session.subscription || session.id;

  // 3. Anti-doublon : si le deal existe deja pour ce paiement, on sort.
  const existant = await findDealByStripeId(String(paymentId));
  if (existant) {
    log.info('deal deja existant pour ce paiement', { dealId: existant, paymentId });
    return { skipped: 'duplicate', dealId: existant };
  }

  const nomComplet = session.customer_details?.name || '';
  const [prenom, ...reste] = nomComplet.split(' ');
  const montant = (session.amount_total || 0) / 100;
  const devise = (session.currency || 'cad').toUpperCase();
  const score = calculerScore(forfaitCle, session);
  const urgence = montant >= 4995 ? 'elevee' : montant >= 1000 ? 'normal' : 'faible';

  // 4. Contact
  const { id: contactId, created } = await upsertContact(email, {
    ...(prenom ? { firstname: prenom } : {}),
    ...(reste.length ? { lastname: reste.join(' ') } : {}),
    ...(session.customer_details?.phone ? { phone: session.customer_details.phone } : {}),
    lifecyclestage: 'customer',
    bw_source: 'stripe',
    bw_forfait: cat?.hubspot || undefined,
    bw_forfait_paye: cat?.hubspot || undefined,
    bw_lead_score: score,
    bw_urgence: urgence,
    bw_budget_estime: montant,
  });

  // 5. Company (uniquement si courriel pro)
  const domaine = domainePro(email);
  const companyId = domaine ? await upsertCompany(domaine, domaine) : null;

  // 6. Deal au stage « Paiement reçu »
  const libelleClient = domaine || nomComplet || email;
  const dealId = await createDeal({
    dealname: `${libelleClient} – ${forfaitCle || 'Forfait BlackWay'}`,
    pipeline: HUBSPOT.pipelineId,
    dealstage: HUBSPOT.stages.paiement_recu,
    amount: String(montant),
    closedate: String(Date.now()),
    bw_forfait: cat?.hubspot || undefined,
    bw_source: 'stripe',
    bw_segment: domaine ? 'Entreprise' : 'Particulier / TPE',
    bw_lead_score: score,
    bw_urgence: urgence,
    bw_stripe_payment_id: String(paymentId),
    bw_livraison_statut: 'non_demarre',
    bw_deadline: String(dateEcheance(cat?.delaiJours ?? 14)),
  });

  await associate('deals', dealId, 'contacts', contactId, HUBSPOT.assoc.dealToContact);
  if (companyId) await associate('deals', dealId, 'companies', companyId, HUBSPOT.assoc.dealToCompany);

  // 7. Note d'audit
  const lignes = lineItems.map((i) => `• ${i.description} × ${i.quantity} — ${(i.amount_total / 100).toFixed(2)} ${devise}`).join('\n');
  await createNote(
    dealId,
    contactId,
    [
      `<b>Paiement Stripe encaissé</b>`,
      `Forfait : ${forfaitCle || 'non reconnu'}`,
      `Montant : ${montant.toFixed(2)} ${devise}`,
      `Mode : ${session.mode === 'subscription' ? 'Abonnement récurrent' : 'Paiement unique'}`,
      `Session : ${session.id}`,
      `Référence : ${paymentId}`,
      `Lead score calculé : ${score}/100`,
      lignes ? `<br>${lignes.replace(/\n/g, '<br>')}` : '',
    ].filter(Boolean).join('<br>')
  );

  // 8. Ticket de livraison
  const ticketId = await createDeliveryTicket(
    {
      subject: `Livraison – ${forfaitCle || 'Forfait BlackWay'} – ${libelleClient}`,
      content: `Déclenché automatiquement par le paiement Stripe ${paymentId}. Délai cible : ${cat?.delaiJours ?? 14} jours.`,
      hs_ticket_priority: urgence === 'elevee' ? 'HIGH' : 'MEDIUM',
    },
    dealId,
    contactId
  );

  // 9. Alerte Slack
  await alerteVente({
    forfait: forfaitCle || 'Forfait non reconnu',
    montant: montant.toFixed(2),
    devise,
    email,
    nom: nomComplet,
    dealId,
    portalId: HUBSPOT.portalId,
  });

  const resultat = { contactId, contactCree: created, companyId, dealId, ticketId, forfait: forfaitCle, montant, score };
  log.info('chaine completee', resultat);
  return resultat;
}
